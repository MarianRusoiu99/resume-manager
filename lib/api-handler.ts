import { getSession, getVerifiedSession } from "@/lib/auth/dal";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { ZodError, type ZodType } from "zod";
import { errorCodeToStatus, ServiceErrorCode, type ServiceResult } from "@/lib/types/service-result";
import { applyRateLimit, getClientIdentifier, addRateLimitHeaders, RateLimitConfigs, type RateLimitConfig } from "@/lib/middleware/rate-limit";
import { isAppError, wrapError } from "@/lib/errors";
import { startRequestTelemetry } from "@/lib/telemetry";

type ApiHandlerContext = {
    params: Promise<Record<string, string>>;
};

type Session = {
    user: {
        id: string;
        email?: string | null;
        name?: string | null;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

/**
 * Handler return type - can be NextResponse or ServiceResult
 * ServiceResult will be automatically converted to NextResponse
 */
type ApiHandlerReturn<T> = Response | NextResponse<T> | ServiceResult<T>;

type ApiHandler<T = unknown, TBody = unknown> = (
    request: Request,
    context: ApiHandlerContext,
    session: Session,
    body: TBody | undefined,
    meta: { requestId: string }
) => Promise<ApiHandlerReturn<T>>;

interface ApiHandlerOptions<TBody = unknown> {
    /** Skip authentication (default: false) */
    isPublic?: boolean;
    /** Whether to require admin (default: false) */
    requireAdmin?: boolean;
    /** Zod schema for request body validation */
    bodySchema?: ZodType<TBody>;
    /** Rate limit configuration key or custom config */
    rateLimit?: keyof typeof RateLimitConfigs | RateLimitConfig;
    /** Verify user exists in database (use for write operations) */
    verifyUser?: boolean;
}

/**
 * Create an API route handler with authentication, logging, and error handling
 */
export function createApiHandler<T = unknown, TBody = unknown>(
    handler: ApiHandler<T, TBody>,
    options: ApiHandlerOptions<TBody> = {}
) {
    return async (request: Request, context: ApiHandlerContext) => {
        const startTime = Date.now();
        const method = request.method;
        const url = request.url;
        const requestId = generateRequestId();

        // Request telemetry (metrics)
        const stopTelemetry = startRequestTelemetry(request);
        let telemetryRecorded = false;
        const recordTelemetry = (statusCode: number) => {
            if (telemetryRecorded) return;
            telemetryRecorded = true;
            try {
                stopTelemetry(statusCode);
            } catch {
                // ignore telemetry recording failures
            }
        };

        // Create request-scoped logger
        const reqLogger = logger.forRequest(requestId);

        try {
            // Authentication check via DAL
            let session = null;
            if (!options.isPublic) {
                // Use verified session for write operations to catch stale sessions
                session = options.verifyUser 
                    ? await getVerifiedSession()
                    : await getSession();
                    
                if (!session?.userId) {
                    reqLogger.warn(`Unauthorized access attempt to ${method} ${url}`);
                    recordTelemetry(401);
                    return NextResponse.json(
                        { 
                            error: options.verifyUser 
                                ? "Session expired. Please log out and log back in." 
                                : "Unauthorized", 
                            requestId 
                        },
                        { status: 401 }
                    );
                }

                if (options.requireAdmin && !session.isAdmin) {
                    reqLogger.warn(`Forbidden (admin required) ${method} ${url}`, { userId: session.userId });
                    recordTelemetry(403);
                    return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403 });
                }
            }

            // Apply rate limiting if configured
            if (options.rateLimit) {
                const rateLimitConfig = typeof options.rateLimit === 'string'
                    ? RateLimitConfigs[options.rateLimit]
                    : options.rateLimit;
                
                const identifier = getClientIdentifier(request, session?.userId);
                const rateLimitResponse = applyRateLimit(identifier, rateLimitConfig, requestId);
                
                if (rateLimitResponse) {
                    reqLogger.warn(`Rate limited: ${method} ${url}`, { userId: session?.userId });
                    recordTelemetry(rateLimitResponse.status);
                    return rateLimitResponse;
                }
            }

            // Parse and validate body if schema provided
            let body: TBody | undefined;
            if (options.bodySchema && ['POST', 'PUT', 'PATCH'].includes(method)) {
                try {
                    const rawBody = await request.json();
                    body = options.bodySchema.parse(rawBody);
                } catch (error) {
                    if (error instanceof ZodError) {
                        recordTelemetry(400);
                        return handleValidationError(error, requestId);
                    }

                    // Invalid JSON payload
                    if (error instanceof SyntaxError) {
                        recordTelemetry(400);
                        return NextResponse.json({ error: 'Invalid JSON', requestId }, { status: 400 });
                    }

                    throw error;
                }
            }

            // Map DAL session to expected Session format
             const apiSession = session ? {
                 user: {
                     id: session.userId,
                     email: session.email,
                     name: session.name,
                     isAdmin: session.isAdmin,
                 }
             } : null;

              // Execute handler
               const handlerResult = await handler(
                   request, 
                   context, 
                   apiSession as unknown as Session,
                   body,
                   { requestId }
               );
  
              // Convert ServiceResult to Response if needed
              let response: Response;
              if (isServiceResult(handlerResult)) {
                  response = serviceResultToResponse(handlerResult, requestId);
              } else {
                  response = handlerResult as Response;
              }

              // Ensure JSON responses follow the universal API envelope
              response = await maybeEnvelopeJsonResponse(response, requestId);

              // Record telemetry once per request
              recordTelemetry(response.status);

            // Add rate limit headers if configured
            if (options.rateLimit) {
                const rateLimitConfig = typeof options.rateLimit === 'string'
                    ? RateLimitConfigs[options.rateLimit]
                    : options.rateLimit;
                const identifier = getClientIdentifier(request, session?.userId);
                response = addRateLimitHeaders(response, identifier, rateLimitConfig);
            }

              // Log success
              const duration = Date.now() - startTime;
              reqLogger.info(`API Request ${method} ${url}`, {
                  duration,
                  status: response.status,
                  userId: session?.userId,
              });

              return response;


        } catch (error) {
            const duration = Date.now() - startTime;
            reqLogger.error(`API Error ${method} ${url}`, error, { duration });

             // Handle specific errors
             if (error instanceof ZodError) {
                 recordTelemetry(400);
                 return handleValidationError(error, requestId);
             }


            // Prefer typed domain errors
            if (isAppError(error)) {
                recordTelemetry(error.statusCode);
                return NextResponse.json(
                    { ...error.toJSON(), requestId },
                    { status: error.statusCode }
                );
            }

             if (error instanceof ServiceError) {
                 const status = errorCodeToStatus(error.code);
                 recordTelemetry(status);
                 return NextResponse.json(
                     { error: error.message, code: error.code, requestId },
                     { status }
                 );
             }


             // Fallback to wrapped internal error
             const wrapped = wrapError(error, 'Internal Server Error');
             recordTelemetry(wrapped.statusCode);
             return NextResponse.json(
                 { ...wrapped.toJSON(), requestId },
                 { status: wrapped.statusCode }
             );

        }
    };
}

/**
 * Handle Zod validation errors with consistent format
 */
async function maybeEnvelopeJsonResponse(response: Response, requestId: string): Promise<Response> {
    const contentType = response.headers.get('content-type') ?? '';

    // Skip non-JSON responses (streams, files, etc.)
    if (!contentType.includes('application/json')) {
        return response;
    }

    // Avoid consuming the stream if there's no body
    if (!response.body) {
        return response;
    }

    let parsedBody: unknown;
    try {
        parsedBody = await response.clone().json();
    } catch {
        // If it claims to be JSON but isn't parseable, leave it alone
        return response;
    }

    const alreadySuccessEnvelope =
        parsedBody &&
        typeof parsedBody === 'object' &&
        'data' in parsedBody &&
        'requestId' in parsedBody;

    const alreadyErrorEnvelope =
        parsedBody &&
        typeof parsedBody === 'object' &&
        'error' in parsedBody &&
        'requestId' in parsedBody;

    if (alreadySuccessEnvelope || alreadyErrorEnvelope) {
        return response;
    }

    const headers = new Headers(response.headers);

    // Ensure requestId is present for JSON errors
    if (response.status >= 400) {
        if (parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody)) {
            return new Response(JSON.stringify({ ...(parsedBody as Record<string, unknown>), requestId }), {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        }

        return new Response(JSON.stringify({ error: String(parsedBody ?? 'Request failed'), requestId }), {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

    return new Response(JSON.stringify({ data: parsedBody, requestId }), {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * Handle Zod validation errors with consistent format
 */
export function handleValidationError(error: ZodError, requestId?: string): NextResponse {
    const details = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
    }));

    logger.warn('Validation error', { 
        requestId, 
        errors: details.length,
        fields: details.map(d => d.field),
    });

    return NextResponse.json(
        {
            error: 'Validation failed',
            details,
            requestId,
        },
        { status: 400 }
    );
}

/**
 * Service error with code for proper HTTP status mapping
 */
export class ServiceError extends Error {
    constructor(
        message: string,
        public readonly code: ServiceErrorCode = 'INTERNAL_ERROR'
    ) {
        super(message);
        this.name = 'ServiceError';
    }
}

/**
 * Create common error responses
 */
export const ApiErrors = {
    notFound: (resource: string, requestId?: string) =>
        NextResponse.json(
            { error: `${resource} not found`, requestId },
            { status: 404 }
        ),
    
    unauthorized: (requestId?: string) =>
        NextResponse.json(
            { error: 'Unauthorized', requestId },
            { status: 401 }
        ),
    
    forbidden: (requestId?: string) =>
        NextResponse.json(
            { error: 'Forbidden', requestId },
            { status: 403 }
        ),
    
    badRequest: (message: string, requestId?: string) =>
        NextResponse.json(
            { error: message, requestId },
            { status: 400 }
        ),
    
    conflict: (message: string, requestId?: string) =>
        NextResponse.json(
            { error: message, requestId },
            { status: 409 }
        ),
    
    rateLimited: (retryAfter?: number, requestId?: string) =>
        NextResponse.json(
            { error: 'Too many requests', retryAfter, requestId },
            { status: 429 }
        ),
};

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Type guard to check if a value is a ServiceResult
 */
function isServiceResult<T>(value: unknown): value is ServiceResult<T> {
    return (
        typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        typeof (value as ServiceResult<T>).success === 'boolean'
    );
}

/**
 * Convert a ServiceResult to NextResponse
 * 
 * This enables API handlers to return ServiceResult directly,
 * reducing boilerplate in route handlers.
 * 
 * @example
 * ```typescript
 * // Before:
 * export const GET = createApiHandler(async (req, ctx, session) => {
 *   const result = await profileService.getProfile(session.user.id);
 *   if (!result.success) {
 *     return NextResponse.json({ error: result.error }, { status: 400 });
 *   }
 *   return NextResponse.json(result.data);
 * });
 * 
 * // After:
 * export const GET = createApiHandler(async (req, ctx, session) => {
 *   return profileService.getProfile(session.user.id);
 * });
 * ```
 */
function serviceResultToResponse<T>(
    result: ServiceResult<T>,
    requestId?: string
): NextResponse {
    if (result.success) {
        return NextResponse.json({ data: result.data, requestId });
    }

    return NextResponse.json(
        { error: result.error, code: result.code ?? 'INTERNAL_ERROR', requestId },
        { status: errorCodeToStatus(result.code) }
    );
}
