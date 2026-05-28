import { getSession, getVerifiedSession } from "@/lib/auth/dal";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { ZodError } from "zod";
import { errorCodeToStatus } from "@/lib/types/error-codes";
import { applyRateLimit, getClientIdentifier, addRateLimitHeaders, RateLimitConfigs } from "@/lib/middleware/rate-limit";
import { isAppError, wrapError } from "@/lib/errors";
import { startRequestTelemetry } from "@/lib/telemetry";
import { 
    type ApiHandler, 
    type ApiHandlerOptions, 
    type ApiHandlerContext, 
    type Session 
} from "./types";
import { 
    ServiceError, 
    handleValidationError 
} from "./errors";
import { 
    generateRequestId, 
    isServiceResult, 
    serviceResultToResponse, 
    maybeEnvelopeJsonResponse 
} from "./utils";

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
                const rateLimitResponse = await applyRateLimit(identifier, rateLimitConfig, requestId);
                
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
                response = await addRateLimitHeaders(response, identifier, rateLimitConfig);
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
