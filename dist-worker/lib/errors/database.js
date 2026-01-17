"use strict";
/**
 * Database Error Classes
 *
 * Error classes for database operations including queries, constraints, and transactions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseQueryError = exports.DatabaseTransactionError = exports.DatabaseConnectionError = exports.ForeignKeyConstraintError = exports.UniqueConstraintError = exports.RecordNotFoundError = exports.DatabaseError = void 0;
exports.isDatabaseError = isDatabaseError;
const base_1 = require("./base");
/**
 * Base database error class
 */
class DatabaseError extends base_1.AppError {
    constructor(message, operation, cause) {
        super(message, cause);
        this.operation = operation;
    }
}
exports.DatabaseError = DatabaseError;
/**
 * Record not found error
 * Thrown when a database query returns no results
 */
class RecordNotFoundError extends DatabaseError {
    constructor(entity, identifier, operation) {
        const message = identifier
            ? `${entity} with ID '${identifier}' not found`
            : `${entity} not found`;
        super(message, operation);
        this.entity = entity;
        this.identifier = identifier;
        this.code = 'NOT_FOUND';
        this.statusCode = 404;
    }
}
exports.RecordNotFoundError = RecordNotFoundError;
/**
 * Unique constraint violation error
 * Thrown when trying to insert/update with duplicate unique field
 */
class UniqueConstraintError extends DatabaseError {
    constructor(entity, field, value, cause) {
        const message = value
            ? `${entity} with ${field} '${value}' already exists`
            : `${entity} with this ${field} already exists`;
        super(message, 'insert/update', cause);
        this.entity = entity;
        this.field = field;
        this.value = value;
        this.code = 'CONFLICT';
        this.statusCode = 409;
    }
}
exports.UniqueConstraintError = UniqueConstraintError;
/**
 * Foreign key constraint violation error
 * Thrown when trying to insert/update with invalid foreign key reference
 */
class ForeignKeyConstraintError extends DatabaseError {
    constructor(entity, field, referencedEntity, cause) {
        super(`Invalid ${field}: referenced ${referencedEntity} does not exist`, 'insert/update', cause);
        this.entity = entity;
        this.field = field;
        this.referencedEntity = referencedEntity;
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.ForeignKeyConstraintError = ForeignKeyConstraintError;
/**
 * Database connection error
 * Thrown when unable to connect to database
 */
class DatabaseConnectionError extends DatabaseError {
    constructor(message = 'Database connection failed', cause) {
        super(message, 'connect', cause);
        this.code = 'EXTERNAL_SERVICE_ERROR';
        this.statusCode = 503;
    }
}
exports.DatabaseConnectionError = DatabaseConnectionError;
/**
 * Database transaction error
 * Thrown when a transaction fails or is rolled back
 */
class DatabaseTransactionError extends DatabaseError {
    constructor(message = 'Database transaction failed', cause) {
        super(message, 'transaction', cause);
        this.code = 'INTERNAL_ERROR';
        this.statusCode = 500;
    }
}
exports.DatabaseTransactionError = DatabaseTransactionError;
/**
 * Database query error
 * Generic error for database query failures
 */
class DatabaseQueryError extends DatabaseError {
    constructor(message, operation, cause) {
        super(message, operation, cause);
        this.code = 'INTERNAL_ERROR';
        this.statusCode = 500;
    }
}
exports.DatabaseQueryError = DatabaseQueryError;
/**
 * Type guard to check if an error is a database error
 */
function isDatabaseError(error) {
    return error instanceof DatabaseError;
}
