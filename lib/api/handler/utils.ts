import { NextResponse } from "next/server";
import { type ServiceResult, errorCodeToStatus } from "@/lib/types/service-result";

/**
 * Type guard to check if a value is a ServiceResult
 */
export function isServiceResult<T>(value: unknown): value is ServiceResult<T> {
    return (
        typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        typeof (value as ServiceResult<T>).success === 'boolean'
    );
}

/**
 * Convert a ServiceResult to NextResponse
 */
export function serviceResultToResponse<T>(
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

/**
 * Ensure JSON responses follow the universal API envelope
 */
export async function maybeEnvelopeJsonResponse(response: Response, requestId: string): Promise<Response> {
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
 * Generate a unique request ID
 */
export function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}
