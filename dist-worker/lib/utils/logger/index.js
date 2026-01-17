"use strict";
/**
 * Logging utility for server-side operations
 * Provides structured logging with different severity levels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTimedLogger = exports.withTiming = exports.logger = exports.sanitize = exports.Logger = void 0;
var logger_1 = require("./logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
var sanitizer_1 = require("./sanitizer");
Object.defineProperty(exports, "sanitize", { enumerable: true, get: function () { return sanitizer_1.sanitize; } });
var utilities_1 = require("./utilities");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return utilities_1.logger; } });
Object.defineProperty(exports, "withTiming", { enumerable: true, get: function () { return utilities_1.withTiming; } });
Object.defineProperty(exports, "createTimedLogger", { enumerable: true, get: function () { return utilities_1.createTimedLogger; } });
