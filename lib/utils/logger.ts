/**
 * Logging utility for server-side operations
 * Provides structured logging with different severity levels
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
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In development, use pretty console output
    if (this.isDevelopment) {
      const color = this.getColor(level);
      console.log(
        `${color}[${level.toUpperCase()}]${this.resetColor} ${timestamp} - ${message}`,
        context ? context : ''
      );
    } else {
      // In production, use JSON format for log aggregation
      console.log(JSON.stringify(logEntry));
    }
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
