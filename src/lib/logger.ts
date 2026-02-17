/**
 * Structured Logger Utility
 * Provides consistent logging with correlation IDs and metadata
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
  correlationId?: string;
  userId?: string;
  timestamp?: string;
}

class Logger {
  private correlationId: string | null = null;

  /**
   * Set correlation ID for tracking requests
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return this.correlationId;
  }

  /**
   * Clear correlation ID
   */
  clearCorrelationId(): void {
    this.correlationId = null;
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      environment: import.meta.env.MODE,
      ...metadata,
    };

    // In production, send to logging service (e.g., Datadog, LogRocket)
    if (import.meta.env.PROD) {
      // TODO: Send to logging service
      // Example: logService.send(logData);
    }

    // Console output with formatting
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    
    if (import.meta.env.DEV) {
      console[consoleMethod](
        `[${level.toUpperCase()}] ${message}`,
        metadata ? metadata : ''
      );
    } else {
      console[consoleMethod](JSON.stringify(logData));
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (import.meta.env.DEV) {
      this.log('debug', message, metadata);
    }
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    const errorMetadata: LogMetadata = {
      ...metadata,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    this.log('error', message, errorMetadata);
  }

  /**
   * Log API call
   */
  apiCall(method: string, url: string, metadata?: LogMetadata): void {
    this.info(`API ${method} ${url}`, {
      ...metadata,
      type: 'api_call',
      method,
      url,
    });
  }

  /**
   * Log API error
   */
  apiError(method: string, url: string, error: Error | unknown, metadata?: LogMetadata): void {
    this.error(`API ${method} ${url} failed`, error, {
      ...metadata,
      type: 'api_error',
      method,
      url,
    });
  }

  /**
   * Log user action
   */
  userAction(action: string, metadata?: LogMetadata): void {
    this.info(`User action: ${action}`, {
      ...metadata,
      type: 'user_action',
      action,
    });
  }
}

export const logger = new Logger();

// Generate correlation ID
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
