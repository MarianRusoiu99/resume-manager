/**
 * Logger Module - Utilities
 * 
 * Utility functions for timing and logging.
 */

import { Logger } from './logger';
import type { LogContext } from './types';

// Create logger with isDevelopment flag to avoid circular dependency with env.ts
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
export const logger = new Logger({}, isDevelopment);

export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.info(`${operation} completed`, { ...context, duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operation} failed`, error, { ...context, duration });
    throw error;
  }
}

export function createTimedLogger(operation: string, context?: LogContext) {
  const startTime = Date.now();
  const log = logger.withContext({ operation, ...context });
  
  return {
    info: (message: string, extraContext?: LogContext) => {
      log.info(message, { ...extraContext, elapsed: Date.now() - startTime });
    },
    warn: (message: string, extraContext?: LogContext) => {
      log.warn(message, { ...extraContext, elapsed: Date.now() - startTime });
    },
    error: (message: string, error?: Error | unknown, extraContext?: LogContext) => {
      log.error(message, error, { ...extraContext, elapsed: Date.now() - startTime });
    },
    complete: (message?: string, extraContext?: LogContext) => {
      log.info(message || `${operation} completed`, { 
        ...extraContext, 
        duration: Date.now() - startTime 
      });
    },
  };
}
