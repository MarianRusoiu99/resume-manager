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

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Client-side environment configuration
 * All values are read directly from process.env since Next.js
 * bundles NEXT_PUBLIC_* variables at build time
 */
class ClientEnvironmentConfig {
  /**
   * Node environment (development | production | test)
   */
  get NODE_ENV(): 'development' | 'production' | 'test' {
    return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  }

  /**
   * Check if running in development mode
   */
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  /**
   * Check if running in production mode
   */
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  /**
   * Check if running in test mode
   */
  get isTest(): boolean {
    return this.NODE_ENV === 'test';
  }

  /**
   * Client-side log level (debug | info | warn | error)
   * Default: 'warn'
   */
  get NEXT_PUBLIC_LOG_LEVEL(): LogLevel {
    return (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'warn';
  }
}

/**
 * Singleton client environment configuration instance
 */
export const clientEnv = new ClientEnvironmentConfig();

/**
 * Type for the client environment configuration
 */
export type ClientEnv = ClientEnvironmentConfig;
