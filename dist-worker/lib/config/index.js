"use strict";
/**
 * Configuration Barrel Exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientEnv = exports.env = void 0;
var env_1 = require("./env");
Object.defineProperty(exports, "env", { enumerable: true, get: function () { return env_1.env; } });
var client_env_1 = require("./client-env");
Object.defineProperty(exports, "clientEnv", { enumerable: true, get: function () { return client_env_1.clientEnv; } });
