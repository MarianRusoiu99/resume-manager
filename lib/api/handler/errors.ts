import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/utils/logger";
import type { ErrorCodeType } from "@/lib/types/error-codes";

/**
 * Service error with code for proper HTTP status mapping
 */
export class ServiceError extends Error {
    constructor(
        message: string,
        public readonly code: ErrorCodeType = 'INTERNAL_ERROR'
    ) {
        super(message);
        this.name = 'ServiceError';
    }
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
