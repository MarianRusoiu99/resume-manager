/**
 * Service Error Codes
 * 
 * Standardized error codes used across all service layer operations.
 * These provide consistent error handling and better debugging.
 */

/**
 * Error codes for service layer operations
 */
export const ErrorCode = {
  /** Resource not found (404 equivalent) */
  NOT_FOUND: 'NOT_FOUND',
  /** Validation failed (400 equivalent) */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Internal server error (500 equivalent) */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** Authentication required (401 equivalent) */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** Permission denied (403 equivalent) */
  FORBIDDEN: 'FORBIDDEN',
  /** Rate limit exceeded (429 equivalent) */
  RATE_LIMITED: 'RATE_LIMITED',
  /** External service error (e.g., AI provider) */
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  /** Configuration missing or invalid */
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  /** Conflict with existing resource */
  CONFLICT: 'CONFLICT',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Map error codes to HTTP status codes
 */
export const errorCodeToHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.CONFIGURATION_ERROR]: 500,
  [ErrorCode.CONFLICT]: 409,
};

/**
 * Get user-friendly error message for error code
 */
export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found',
    [ErrorCode.VALIDATION_ERROR]: 'The provided data is invalid',
    [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred',
    [ErrorCode.UNAUTHORIZED]: 'Authentication is required',
    [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
    [ErrorCode.RATE_LIMITED]: 'Too many requests, please try again later',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service is unavailable',
    [ErrorCode.CONFIGURATION_ERROR]: 'System configuration error',
    [ErrorCode.CONFLICT]: 'This operation conflicts with existing data',
  };
  return messages[code];
}
