import { type ZodType } from "zod";
import { type ServiceResult } from "@/lib/types/service-result";
import { type RateLimitConfigs, type RateLimitConfig } from "@/lib/middleware/rate-limit";
import { NextResponse } from "next/server";

export type ApiHandlerContext = {
    params: Promise<Record<string, string>>;
};

export type Session = {
    user: {
        id: string;
        email?: string | null;
        name?: string | null;
        isAdmin?: boolean;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

/**
 * Handler return type - can be NextResponse or ServiceResult
 * ServiceResult will be automatically converted to NextResponse
 */
export type ApiHandlerReturn<T> = Response | NextResponse<T> | ServiceResult<T>;

export type ApiHandler<T = unknown, TBody = unknown> = (
    request: Request,
    context: ApiHandlerContext,
    session: Session,
    body: TBody | undefined,
    meta: { requestId: string }
) => Promise<ApiHandlerReturn<T>>;

export interface ApiHandlerOptions<TBody = unknown> {
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
