import { getSession, getVerifiedSession } from "@/lib/auth/dal";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { ZodError, ZodSchema } from "zod";
import { errorCodeToStatus, ServiceErrorCode, type ServiceResult } from "@/lib/types/service-result";
import { applyRateLimit, getClientIdentifier, addRateLimitHeaders, RateLimitConfigs, type RateLimitConfig } from "@/lib/middleware/rate-limit";

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
type ApiHandlerReturn<T> = NextResponse<T> | NextResponse<unknown> | ServiceResult<T>;

type ApiHandler<T = unknown, TBody = unknown> = (
    request: Request,
    context: ApiHandlerContext,
    session: Session,
    body?: TBody
) => Promise<ApiHandlerReturn<T>>;

interface ApiHandlerOptions<TBody = unknown> {
    /** Skip authentication (default: false) */
    isPublic?: boolean;
    /** Zod schema for request body validation */
    bodySchema?: ZodSchema<TBody>;
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
            }

            // Apply rate limiting if configured
            if (options.rateLimit) {
                const rateLimitConfig = typeof options.rateLimit === 'string'
                    ? RateLimitConfigs[options.rateLimit]
                    : options.rateLimit;
                
                const identifier = getClientIdentifier(request, session?.userId);
                const rateLimitResponse = applyRateLimit(identifier, rateLimitConfig);
                
                if (rateLimitResponse) {
                    reqLogger.warn(`Rate limited: ${method} ${url}`, { userId: session?.userId });
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
                        return handleValidationError(error, requestId);
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
                }
            } : null;

            // Execute handler
            const handlerResult = await handler(
                request, 
                context, 
                apiSession as unknown as Session,
                body
            );

            // Convert ServiceResult to NextResponse if needed
            let response: NextResponse;
            if (isServiceResult(handlerResult)) {
                response = serviceResultToResponse(handlerResult, requestId);
            } else {
                response = handlerResult as NextResponse;
            }

            // Add rate limit headers if configured
            if (options.rateLimit) {
                const rateLimitConfig = typeof options.rateLimit === 'string'
                    ? RateLimitConfigs[options.rateLimit]
                    : options.rateLimit;
                const identifier = getClientIdentifier(request, session?.userId);
                response = addRateLimitHeaders(response, identifier, rateLimitConfig) as NextResponse;
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
                return handleValidationError(error, requestId);
            }

            if (error instanceof ServiceError) {
                return NextResponse.json(
                    { error: error.message, code: error.code, requestId },
                    { status: errorCodeToStatus(error.code) }
                );
            }

            if (error instanceof Error && error.message.includes("not found")) {
                return NextResponse.json(
                    { error: "Resource not found", requestId },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: "Internal Server Error", requestId },
                { status: 500 }
            );
        }
    };
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
        return NextResponse.json(result.data);
    }
    
    return NextResponse.json(
        { error: result.error, code: result.code, requestId },
        { status: errorCodeToStatus(result.code) }
    );
}
