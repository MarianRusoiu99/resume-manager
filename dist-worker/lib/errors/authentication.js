"use strict";
/**
 * Authentication and Authorization Error Classes
 *
 * Error classes for authentication and authorization operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountLockedError = exports.InvalidTokenError = exports.SessionExpiredError = exports.InvalidCredentialsError = exports.ForbiddenError = exports.UnauthorizedError = exports.AuthenticationError = void 0;
exports.isAuthenticationError = isAuthenticationError;
const base_1 = require("./base");
/**
 * Base authentication error class
 */
class AuthenticationError extends base_1.AppError {
    constructor(message, cause) {
        super(message, cause);
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Unauthorized error (401)
 * Thrown when authentication is required but not provided or invalid
 */
class UnauthorizedError extends AuthenticationError {
    constructor(message = 'Authentication required', cause) {
        super(message, cause);
        this.code = 'UNAUTHORIZED';
        this.statusCode = 401;
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Forbidden error (403)
 * Thrown when user is authenticated but doesn't have permission
 */
class ForbiddenError extends AuthenticationError {
    constructor(message = 'Access denied', cause) {
        super(message, cause);
        this.code = 'FORBIDDEN';
        this.statusCode = 403;
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Invalid credentials error
 * Thrown when login credentials are incorrect
 */
class InvalidCredentialsError extends AuthenticationError {
    constructor(message = 'Invalid email or password', cause) {
        super(message, cause);
        this.code = 'UNAUTHORIZED';
        this.statusCode = 401;
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
/**
 * Session expired error
 * Thrown when user session has expired
 */
class SessionExpiredError extends AuthenticationError {
    constructor(message = 'Session expired. Please log in again.', cause) {
        super(message, cause);
        this.code = 'UNAUTHORIZED';
        this.statusCode = 401;
    }
}
exports.SessionExpiredError = SessionExpiredError;
/**
 * Invalid token error
 * Thrown when authentication token is invalid or malformed
 */
class InvalidTokenError extends AuthenticationError {
    constructor(message = 'Invalid authentication token', cause) {
        super(message, cause);
        this.code = 'UNAUTHORIZED';
        this.statusCode = 401;
    }
}
exports.InvalidTokenError = InvalidTokenError;
/**
 * Account locked error
 * Thrown when user account is locked (e.g., too many failed login attempts)
 */
class AccountLockedError extends AuthenticationError {
    constructor(message = 'Account is locked', unlockTime, cause) {
        super(message, cause);
        this.unlockTime = unlockTime;
        this.code = 'FORBIDDEN';
        this.statusCode = 403;
    }
}
exports.AccountLockedError = AccountLockedError;
/**
 * Type guard to check if an error is an authentication error
 */
function isAuthenticationError(error) {
    return error instanceof AuthenticationError;
}
