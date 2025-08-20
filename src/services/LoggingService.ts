/**
 * Centralized logging service that respects user privacy
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: Record<string, unknown>;
}

export class LoggingService {
  private static instance: LoggingService;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    // Set log level based on environment
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      this.logLevel = LogLevel.DEBUG;
    }
  }

  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log debug message
   */
  debug(
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log info message
   */
  info(
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log warning message
   */
  warn(
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log error message
   */
  error(
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * Log error object
   */
  logError(error: Error, context?: string): void {
    this.log(LogLevel.ERROR, error.message, context, {
      name: error.name,
      stack: error.stack,
    });
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data: this.sanitizeData(data),
    };

    // Add to internal log storage
    this.logs.push(logEntry);

    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console
    this.outputToConsole(logEntry);
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(
    data?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!data) return undefined;

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Check if field contains sensitive information
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password',
      'token',
      'key',
      'secret',
      'auth',
      'credential',
    ];
    return sensitiveFields.some((sensitive) =>
      fieldName.toLowerCase().includes(sensitive)
    );
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp.toISOString()}]`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const fullMessage = `${prefix}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(fullMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, entry.data);
        break;
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}
