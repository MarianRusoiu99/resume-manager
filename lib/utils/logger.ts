/**
 * Logging utility for server-side operations
 * Provides structured logging with different severity levels
 * 
 * Features:
 * - Structured JSON logging for production
 * - Pretty console output for development
 * - Context attachment for request tracking
 * - Performance timing utilities
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private baseContext: LogContext = {};

  /**
   * Create a new logger instance with base context
   */
  constructor(context: LogContext = {}) {
    this.baseContext = context;
  }

  /**
   * Create a child logger with additional context
   * Useful for attaching request-specific data
   */
  withContext(context: LogContext): Logger {
    return new Logger({ ...this.baseContext, ...context });
  }

  /**
   * Create a request-scoped logger with request ID and user ID
   */
  forRequest(requestId?: string, userId?: string): Logger {
    return this.withContext({
      requestId: requestId || this.generateRequestId(),
      userId,
    });
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : error,
    };
    this.log('error', message, errorContext);
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.baseContext, ...context };
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...mergedContext,
    };

    // In development, use pretty console output
    if (this.isDevelopment) {
      const color = this.getColor(level);
      const contextStr = Object.keys(mergedContext).length > 0 
        ? ` ${JSON.stringify(mergedContext)}`
        : '';
      console.log(
        `${color}[${level.toUpperCase()}]${this.resetColor} ${timestamp} - ${message}${contextStr}`
      );
    } else {
      // In production, use JSON format for log aggregation
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get ANSI color code for log level
   */
  private getColor(level: LogLevel): string {
    switch (level) {
      case 'info':
        return '\x1b[36m'; // Cyan
      case 'warn':
        return '\x1b[33m'; // Yellow
      case 'error':
        return '\x1b[31m'; // Red
      case 'debug':
        return '\x1b[90m'; // Gray
      default:
        return '';
    }
  }

  private get resetColor(): string {
    return '\x1b[0m';
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Measure execution time of async operations
 */
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

/**
 * Create a timed logger for tracking operation duration
 */
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
