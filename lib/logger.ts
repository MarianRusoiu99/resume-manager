type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    message: string;
    level: LogLevel;
    timestamp: string;
    [key: string]: unknown;
}

class Logger {
    private isDev = process.env.NODE_ENV === 'development';

    private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
        const entry: LogEntry = {
            message,
            level,
            timestamp: new Date().toISOString(),
            ...meta,
        };

        if (this.isDev) {
            const color = {
                info: '\x1b[36m', // Cyan
                warn: '\x1b[33m', // Yellow
                error: '\x1b[31m', // Red
                debug: '\x1b[35m', // Magenta
            }[level];
            const reset = '\x1b[0m';

            console.log(
                `${color}[${level.toUpperCase()}]${reset} ${message}`,
                meta ? meta : ''
            );
        } else {
            // In production, log as JSON for better parsing by log aggregators
            console.log(JSON.stringify(entry));
        }
    }

    info(message: string, meta?: Record<string, unknown>) {
        this.log('info', message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>) {
        this.log('warn', message, meta);
    }

    error(message: string, meta?: Record<string, unknown>) {
        this.log('error', message, meta);
    }

    debug(message: string, meta?: Record<string, unknown>) {
        this.log('debug', message, meta);
    }
}

export const logger = new Logger();
