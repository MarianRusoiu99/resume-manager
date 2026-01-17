"use strict";
/**
 * Validation Error Classes
 *
 * Error classes for input validation and schema validation operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidFormatError = exports.FieldLengthError = exports.InvalidFieldError = exports.RequiredFieldError = exports.SchemaValidationError = exports.ValidationError = void 0;
exports.isValidationError = isValidationError;
const base_1 = require("./base");
/**
 * Base validation error class
 */
class ValidationError extends base_1.AppError {
    constructor(message, field, details, cause) {
        super(message, cause);
        this.field = field;
        this.details = details;
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.ValidationError = ValidationError;
/**
 * Schema validation error
 * Thrown when data doesn't match expected schema
 */
class SchemaValidationError extends ValidationError {
    constructor(message, schema, errors, cause) {
        super(message, undefined, { schema, errors }, cause);
        this.schema = schema;
        this.errors = errors;
    }
}
exports.SchemaValidationError = SchemaValidationError;
/**
 * Required field missing error
 * Thrown when a required field is not provided
 */
class RequiredFieldError extends ValidationError {
    constructor(field, cause) {
        super(`Required field '${field}' is missing`, field, undefined, cause);
    }
}
exports.RequiredFieldError = RequiredFieldError;
/**
 * Invalid field value error
 * Thrown when a field value is invalid
 */
class InvalidFieldError extends ValidationError {
    constructor(field, reason, value, cause) {
        super(`Invalid value for field '${field}': ${reason}`, field, { value }, cause);
        this.value = value;
    }
}
exports.InvalidFieldError = InvalidFieldError;
/**
 * Field length error
 * Thrown when field value length is invalid
 */
class FieldLengthError extends ValidationError {
    constructor(field, min, max, actual, cause) {
        let message = `Invalid length for field '${field}'`;
        if (min !== undefined && max !== undefined) {
            message += ` (must be between ${min} and ${max} characters)`;
        }
        else if (min !== undefined) {
            message += ` (must be at least ${min} characters)`;
        }
        else if (max !== undefined) {
            message += ` (must be at most ${max} characters)`;
        }
        if (actual !== undefined) {
            message += `. Got ${actual} characters`;
        }
        super(message, field, { min, max, actual }, cause);
        this.min = min;
        this.max = max;
        this.actual = actual;
    }
}
exports.FieldLengthError = FieldLengthError;
/**
 * Invalid format error
 * Thrown when field value format is invalid (e.g., email, URL, date)
 */
class InvalidFormatError extends ValidationError {
    constructor(field, expectedFormat, value, cause) {
        super(`Invalid format for field '${field}' (expected ${expectedFormat})`, field, { expectedFormat, value }, cause);
        this.expectedFormat = expectedFormat;
        this.value = value;
    }
}
exports.InvalidFormatError = InvalidFormatError;
/**
 * Type guard to check if an error is a validation error
 */
function isValidationError(error) {
    return error instanceof ValidationError;
}
