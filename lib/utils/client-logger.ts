/**
 * Client-side Logger Utility
 * 
 * Provides structured logging for client-side code with:
 * - Environment-aware logging (silent in production by default)
 * - Consistent formatting
 * - Error tracking integration support
 * - Log level filtering
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

interface ClientLoggerConfig {
  /** Minimum log level to display */
  minLevel: LogLevel;
  /** Whether logging is enabled */
  enabled: boolean;
  /** Prefix for all log messages */
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDevelopment = process.env.NODE_ENV === 'development';

const defaultConfig: ClientLoggerConfig = {
  minLevel: isDevelopment ? 'debug' : 'warn',
  enabled: true,
  prefix: '[App]',
};

class ClientLogger {
  private config: ClientLoggerConfig;
  private context: LogContext;

  constructor(config: Partial<ClientLoggerConfig> = {}, context: LogContext = {}) {
    this.config = { ...defaultConfig, ...config };
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  withContext(context: LogContext): ClientLogger {
    return new ClientLogger(this.config, { ...this.context, ...context });
  }

  /**
   * Create a component-scoped logger
   */
  forComponent(component: string): ClientLogger {
    return this.withContext({ component });
  }

  /**
   * Check if a log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  /**
   * Format the log message with context
   */
  private formatMessage(level: LogLevel, message: string): string {
    const parts = [this.config.prefix];
    
    if (this.context.component) {
      parts.push(`[${this.context.component}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }

  /**
   * Get context data for structured logging
   */
  private getContextData(additionalContext?: LogContext): LogContext | undefined {
    const merged = { ...this.context, ...additionalContext };
    // Remove component from context data as it's in the message
    delete merged.component;
    
    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    
    const contextData = this.getContextData(context);
    if (contextData) {
      console.debug(this.formatMessage('debug', message), contextData);
    } else {
      console.debug(this.formatMessage('debug', message));
    }
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    
    const contextData = this.getContextData(context);
    if (contextData) {
      console.info(this.formatMessage('info', message), contextData);
    } else {
      console.info(this.formatMessage('info', message));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    
    const contextData = this.getContextData(context);
    if (contextData) {
      console.warn(this.formatMessage('warn', message), contextData);
    } else {
      console.warn(this.formatMessage('warn', message));
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    
    const errorContext = {
      ...this.getContextData(context),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
      } : error,
    };
    
    console.error(this.formatMessage('error', message), errorContext);
    
    // Future: Send to error tracking service
    // if (typeof window !== 'undefined' && window.errorTracker) {
    //   window.errorTracker.captureException(error, { extra: errorContext });
    // }
  }

  /**
   * Time an async operation
   */
  async time<T>(label: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    if (!this.shouldLog('debug')) {
      return fn();
    }

    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      this.debug(`${label} completed`, { ...context, duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`${label} failed`, error, { ...context, duration: `${duration}ms` });
      throw error;
    }
  }

  /**
   * Group related logs together
   */
  group(label: string, fn: () => void): void {
    if (!this.shouldLog('debug')) {
      fn();
      return;
    }

    console.group(this.formatMessage('debug', label));
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }
}

// Export singleton instance
export const clientLogger = new ClientLogger();

// Export class for creating custom instances
export { ClientLogger };

// Convenience exports for common component loggers
export const createComponentLogger = (component: string) => 
  clientLogger.forComponent(component);
