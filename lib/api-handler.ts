import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

type ApiHandlerContext = {
    params: Promise<Record<string, string>>;
};

type Session = {
    user: {
        id: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

type ApiHandler<T = unknown> = (
    request: Request,
    context: ApiHandlerContext,
    session: Session
) => Promise<NextResponse<T> | NextResponse<unknown>>;

interface ApiHandlerOptions {
    isPublic?: boolean;
}

export function createApiHandler<T = unknown>(
    handler: ApiHandler<T>,
    options: ApiHandlerOptions = {}
) {
    return async (request: Request, context: ApiHandlerContext) => {
        const startTime = Date.now();
        const method = request.method;
        const url = request.url;

        try {
            // Authentication check
            let session = null;
            if (!options.isPublic) {
                session = await auth();
                if (!session?.user?.id) {
                    logger.warn(`Unauthorized access attempt to ${method} ${url}`);
                    return NextResponse.json(
                        { error: "Unauthorized" },
                        { status: 401 }
                    );
                }
            }

            // Execute handler
            const response = await handler(request, context, session as unknown as Session);

            // Log success
            const duration = Date.now() - startTime;
            logger.info(`API Request ${method} ${url}`, {
                duration,
                status: response.status,
                userId: session?.user?.id,
            });

            return response;

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`API Error ${method} ${url}`, {
                duration,
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            });

            // Handle specific errors
            if (error instanceof Error && error.message.includes("not found")) {
                return NextResponse.json(
                    { error: "Resource not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { error: "Internal Server Error" },
                { status: 500 }
            );
        }
    };
}
