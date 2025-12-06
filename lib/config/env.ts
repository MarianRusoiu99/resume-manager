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
  APP_NAME: z.string().default('Resume Optimizer'),

  // Feature flags
  ANALYZE: z.string().transform(v => v === 'true').optional(),
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
      console.warn('⚠️ Environment variable validation warnings:');
      for (const issue of parsed.error.issues) {
        console.warn(`   ${issue.path.join('.')}: ${issue.message}`);
      }
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
        APP_NAME: process.env.APP_NAME || 'Resume Optimizer',
        ANALYZE: process.env.ANALYZE === 'true',
      };
    }
    
    // In production, fail fast with clear errors
    console.error('❌ Invalid environment variables:');
    for (const issue of parsed.error.issues) {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
}

/**
 * Validated environment configuration
 */
class EnvironmentConfig {
  private readonly config: z.infer<typeof envSchema>;

  constructor() {
    this.config = parseEnv();
  }

  // Node environment helpers
  get NODE_ENV() { return this.config.NODE_ENV; }
  get isProduction() { return this.config.NODE_ENV === 'production'; }
  get isDevelopment() { return this.config.NODE_ENV === 'development'; }
  get isTest() { return this.config.NODE_ENV === 'test'; }

  // Database
  get DATABASE_URL() { return this.config.DATABASE_URL; }

  // Authentication
  get NEXTAUTH_SECRET() { return this.config.NEXTAUTH_SECRET; }
  get NEXTAUTH_URL() { return this.config.NEXTAUTH_URL; }

  // Encryption
  get ENCRYPTION_KEY() { return this.config.ENCRYPTION_KEY; }
  get hasEncryptionKey() { return !!this.config.ENCRYPTION_KEY; }

  // Redis
  get REDIS_URL() { return this.config.REDIS_URL; }
  get REDIS_KEY_PREFIX() { return this.config.REDIS_KEY_PREFIX; }
  get hasRedis() { return !!this.config.REDIS_URL; }

  // AI Providers
  get OPENAI_API_KEY() { return this.config.OPENAI_API_KEY; }
  get ANTHROPIC_API_KEY() { return this.config.ANTHROPIC_API_KEY; }

  // Application
  get APP_VERSION() { return this.config.APP_VERSION; }
  get APP_NAME() { return this.config.APP_NAME; }

  // Feature flags
  get shouldAnalyze() { return this.config.ANALYZE ?? false; }
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
