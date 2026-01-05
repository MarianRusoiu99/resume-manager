/**
 * Environment Configuration
 * 
 * Type-safe environment variable access with validation.
 * Centralizes all environment variable access to prevent typos
 * and ensure required variables are present.
 * 
 * @example
 * ```typescript
 * import { env } from '@/lib/config/env';
 * 
 * const dbUrl = env.DATABASE_URL;
 * const isProduction = env.isProduction;
 * ```
 */

import { z } from 'zod';
import { ConfigurationError } from '../errors';
import { logger } from '../utils/logger';
/**
 * Environment variable schema
 * Add all environment variables here with their expected types
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().optional(),

  // Authentication
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().optional(),
  REDIS_KEY_PREFIX: z.string().default('resume-optimizer:'),

  // AI Providers (optional - users add their own)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Application
  APP_VERSION: z.string().default('1.0.0'),
  APP_NAME: z.string().default('Resume Manager'),

  // Admin access (comma-separated emails)
  ADMIN_EMAILS: z.string().optional(),

  // Feature flags
  ANALYZE: z.string().transform(v => v === 'true').optional(),

  // Trusted hosts (comma-separated)
  TRUSTED_HOSTS: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Returns a partial config that won't throw on missing variables
 */
function parseEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // In development, just warn about issues
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Environment variable validation warnings', {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      // Return a default config for development
      return {
        NODE_ENV: 'development',
        DATABASE_URL: process.env.DATABASE_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
        REDIS_URL: process.env.REDIS_URL,
        REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || 'resume-optimizer:',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        APP_VERSION: process.env.APP_VERSION || '1.0.0',
        APP_NAME: process.env.APP_NAME || 'Resume Manager',
        ADMIN_EMAILS: process.env.ADMIN_EMAILS,
        ANALYZE: process.env.ANALYZE === 'true',
        TRUSTED_HOSTS: process.env.TRUSTED_HOSTS,
      };
    }

    // In production, fail fast with clear errors
    logger.error('Invalid environment variables', undefined, {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    throw new ConfigurationError('Invalid environment configuration');
  }

  return parsed.data;
}

/**
 * Validated environment configuration
 */
class EnvironmentConfig {
  private readonly config: z.infer<typeof envSchema>;
  private _validated = false;

  constructor() {
    this.config = parseEnv();
    // Don't validate in constructor - defer to runtime
    // This allows next.config.ts to import env without triggering validation
  }

  /**
   * Validate production-specific requirements (called lazily)
   */
  private validateProductionRequirements(): void {
    if (this._validated) return;
    this._validated = true;

    if (this.config.NODE_ENV !== 'production') {
      return;
    }

    // Skip validation during build time
    // Next.js sets NEXT_PHASE during various build phases
    const buildPhases = [
      'phase-production-build',
      'phase-export',
    ];
    
    const currentPhase = process.env.NEXT_PHASE;
    
    if (currentPhase && buildPhases.includes(currentPhase)) {
      return;
    }

    // Also skip if we're clearly in a build/CI environment
    if (process.env.CI === 'true' || process.env.BUILDING === 'true') {
      return;
    }

    // Required variables in production (runtime only)
    if (!this.config.DATABASE_URL) {
      throw new ConfigurationError('DATABASE_URL is required in production');
    }

    if (!this.config.NEXTAUTH_SECRET) {
      throw new ConfigurationError('NEXTAUTH_SECRET is required in production');
    }

    if (!this.config.ENCRYPTION_KEY) {
      throw new ConfigurationError('ENCRYPTION_KEY is required in production');
    }

    // Check for default/weak secrets
    const defaultSecrets = [
      'your-nextauth-secret-key-here-min-32-chars',
      'your-encryption-key-here-minimum-32-characters',
      'changeme',
      'secret',
      'password',
    ];

    if (this.config.NEXTAUTH_SECRET && defaultSecrets.includes(this.config.NEXTAUTH_SECRET)) {
      throw new ConfigurationError(
        'NEXTAUTH_SECRET is using a default/weak value. Change it in production! ' +
        'Generate a secure value with: openssl rand -base64 32'
      );
    }

    if (this.config.ENCRYPTION_KEY && defaultSecrets.includes(this.config.ENCRYPTION_KEY)) {
      throw new ConfigurationError(
        'ENCRYPTION_KEY is using a default/weak value. Change it in production! ' +
        'Generate a secure value with: openssl rand -hex 32'
      );
    }

    // Warn about missing optional but recommended configs
    if (!this.config.REDIS_URL) {
      logger.warn(
        'REDIS_URL not configured in production. ' +
        'Using in-memory storage (not suitable for multi-instance deployments)'
      );
    }

    if (!this.config.NEXTAUTH_URL) {
      logger.warn('NEXTAUTH_URL not configured. This may cause authentication issues.');
    }
  }

  // Node environment helpers (safe at build time)
  get NODE_ENV() { return this.config.NODE_ENV; }
  get isProduction() { return this.config.NODE_ENV === 'production'; }
  get isDevelopment() { return this.config.NODE_ENV === 'development'; }
  get isTest() { return this.config.NODE_ENV === 'test'; }

  // Database (runtime-only, triggers validation)
  get DATABASE_URL() { 
    this.validateProductionRequirements();
    return this.config.DATABASE_URL; 
  }

  // Authentication (runtime-only, triggers validation)
  get NEXTAUTH_SECRET() { 
    this.validateProductionRequirements();
    return this.config.NEXTAUTH_SECRET; 
  }
  get authSecret() { 
    this.validateProductionRequirements();
    return this.config.NEXTAUTH_SECRET; 
  }
  get NEXTAUTH_URL() { return this.config.NEXTAUTH_URL; }

  // Encryption (runtime-only, triggers validation)
  get ENCRYPTION_KEY() { 
    this.validateProductionRequirements();
    return this.config.ENCRYPTION_KEY; 
  }
  get hasEncryptionKey() { return !!this.config.ENCRYPTION_KEY; }

  // Redis (safe at build time - optional)
  get REDIS_URL() { return this.config.REDIS_URL; }
  get REDIS_KEY_PREFIX() { return this.config.REDIS_KEY_PREFIX; }
  get hasRedis() { return !!this.config.REDIS_URL; }

  // AI Providers (safe at build time - optional)
  get OPENAI_API_KEY() { return this.config.OPENAI_API_KEY; }
  get ANTHROPIC_API_KEY() { return this.config.ANTHROPIC_API_KEY; }

  // Application (safe at build time)
  get APP_VERSION() { return this.config.APP_VERSION; }
  get APP_NAME() { return this.config.APP_NAME; }

  // Admin access (safe at build time)
  get ADMIN_EMAILS() { return this.config.ADMIN_EMAILS; }
  get adminEmails(): string[] {
    const raw = this.config.ADMIN_EMAILS;
    if (!raw) return [];
    return raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  // Feature flags (safe at build time)
  get shouldAnalyze() { return this.config.ANALYZE ?? false; }

  // Trusted hosts (safe at build time)
  get trustedHosts(): string[] {
    const raw = this.config.TRUSTED_HOSTS;
    if (!raw) return [];
    return raw
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean);
  }
}

/**
 * Singleton environment configuration instance
 * 
 * Use this for type-safe access to environment variables:
 * ```typescript
 * import { env } from '@/lib/config/env';
 * 
 * if (env.isProduction) {
 *   // Production-only code
 * }
 * ```
 */
export const env = new EnvironmentConfig();

/**
 * Type for the environment configuration
 */
export type Env = EnvironmentConfig;
