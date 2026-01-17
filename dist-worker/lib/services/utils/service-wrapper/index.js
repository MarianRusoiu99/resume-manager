"use strict";
/**
 * Service Wrapper Module
 *
 * Provides utilities to reduce boilerplate in service methods:
 * - Standardized error handling
 * - Automatic logging
 * - Consistent ServiceResult wrapping
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainOperations = exports.runParallel = exports.withServiceErrorSync = exports.withServiceError = exports.handleServiceError = exports.ServiceErrors = exports.isServiceOperationError = exports.appErrorToServiceCode = exports.ServiceOperationError = exports.ExternalServiceError = exports.RateLimitError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
var errors_1 = require("./errors");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return errors_1.AppError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return errors_1.NotFoundError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "UnauthorizedError", { enumerable: true, get: function () { return errors_1.UnauthorizedError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return errors_1.ForbiddenError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return errors_1.ConflictError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_1.RateLimitError; } });
Object.defineProperty(exports, "ExternalServiceError", { enumerable: true, get: function () { return errors_1.ExternalServiceError; } });
var errors_2 = require("./errors");
Object.defineProperty(exports, "ServiceOperationError", { enumerable: true, get: function () { return errors_2.ServiceOperationError; } });
Object.defineProperty(exports, "appErrorToServiceCode", { enumerable: true, get: function () { return errors_2.appErrorToServiceCode; } });
Object.defineProperty(exports, "isServiceOperationError", { enumerable: true, get: function () { return errors_2.isServiceOperationError; } });
Object.defineProperty(exports, "ServiceErrors", { enumerable: true, get: function () { return errors_2.ServiceErrors; } });
var error_handler_1 = require("./error-handler");
Object.defineProperty(exports, "handleServiceError", { enumerable: true, get: function () { return error_handler_1.handleServiceError; } });
var wrapper_1 = require("./wrapper");
Object.defineProperty(exports, "withServiceError", { enumerable: true, get: function () { return wrapper_1.withServiceError; } });
Object.defineProperty(exports, "withServiceErrorSync", { enumerable: true, get: function () { return wrapper_1.withServiceErrorSync; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "runParallel", { enumerable: true, get: function () { return utils_1.runParallel; } });
Object.defineProperty(exports, "chainOperations", { enumerable: true, get: function () { return utils_1.chainOperations; } });
