"use strict";
/**
 * Client-side Environment Configuration
 *
 * Provides type-safe access to public environment variables that are
 * available on the client side (NEXT_PUBLIC_* prefixed).
 *
 * Note: This file is bundled by Next.js and will replace public env vars
 * at build time. All values here must be prefixed with NEXT_PUBLIC_.
 *
 * @example
 * ```typescript
 * import { clientEnv } from '@/lib/config/client-env';
 *
 * const logLevel = clientEnv.NEXT_PUBLIC_LOG_LEVEL;
 * const isDevelopment = clientEnv.isDevelopment;
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientEnv = void 0;
/**
 * Client-side environment configuration
 * All values are read directly from process.env since Next.js
 * bundles NEXT_PUBLIC_* variables at build time
 */
class ClientEnvironmentConfig {
    /**
     * Node environment (development | production | test)
     */
    get NODE_ENV() {
        return process.env.NODE_ENV || 'development';
    }
    /**
     * Check if running in development mode
     */
    get isDevelopment() {
        return this.NODE_ENV === 'development';
    }
    /**
     * Check if running in production mode
     */
    get isProduction() {
        return this.NODE_ENV === 'production';
    }
    /**
     * Check if running in test mode
     */
    get isTest() {
        return this.NODE_ENV === 'test';
    }
    /**
     * Client-side log level (debug | info | warn | error)
     * Default: 'warn'
     */
    get NEXT_PUBLIC_LOG_LEVEL() {
        return process.env.NEXT_PUBLIC_LOG_LEVEL || 'warn';
    }
}
/**
 * Singleton client environment configuration instance
 */
exports.clientEnv = new ClientEnvironmentConfig();
