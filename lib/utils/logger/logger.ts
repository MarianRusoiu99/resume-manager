/**
 * Logger Module - Logger Class
 * 
 * Main logger implementation.
 */

import type { LogLevel, LogContext } from './types';
import { sanitize } from './sanitizer';

class Logger {
  private isDevelopment: boolean;
  private baseContext: LogContext = {};

  constructor(context: LogContext = {}, isDevelopment?: boolean) {
    this.baseContext = context;
    // Access NODE_ENV directly to avoid circular dependency with lib/config/env.ts
    this.isDevelopment = isDevelopment ?? (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');
  }

  withContext(context: LogContext): Logger {
    return new Logger({ ...this.baseContext, ...context });
  }

  forRequest(requestId?: string, userId?: string): Logger {
    return new Logger(
      {
        requestId: requestId || this.generateRequestId(),
        userId,
        ...this.baseContext,
      },
      this.isDevelopment
    );
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

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

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.baseContext, ...context };
    const sanitizedContext = sanitize(mergedContext) as LogContext;
    
    const logEntry = {
      timestamp,
      level,
      message,
      ...sanitizedContext,
    };

    if (this.isDevelopment) {
      const color = this.getColor(level);
      const contextStr = Object.keys(sanitizedContext).length > 0 
        ? ` ${JSON.stringify(sanitizedContext)}`
        : '';
      console.log(
        `${color}[${level.toUpperCase()}]${this.resetColor} ${timestamp} - ${message}${contextStr}`
      );
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case 'info':
        return '\x1b[36m';
      case 'warn':
        return '\x1b[33m';
      case 'error':
        return '\x1b[31m';
      case 'debug':
        return '\x1b[90m';
      default:
        return '';
    }
  }

  private get resetColor(): string {
    return '\x1b[0m';
  }
}

export { Logger };
