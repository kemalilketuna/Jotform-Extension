/**
 * Centralized logging service that respects user privacy
 */

import { EnvironmentConfig, LogLevel } from '../utils/EnvironmentConfig';
import { LoggingConfig } from '../config';
import { SingletonManager } from '../utils/SingletonService';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: Record<string, unknown>;
}

export class LoggingService {
  private logs: LogEntry[] = [];
  private readonly maxLogs = LoggingConfig.LIMITS.MAX_LOGS;
  private readonly logLevel =
    EnvironmentConfig.getInstance().getDebugLogLevel();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): LoggingService {
    return SingletonManager.getInstance(
      'LoggingService',
      () => new LoggingService()
    );
  }

  /**
   * Log debug message
   */
  debug = this.createLogMethod(LogLevel.DEBUG);

  /**
   * Log info message
   */
  info = this.createLogMethod(LogLevel.INFO);

  /**
   * Log warning message
   */
  warn = this.createLogMethod(LogLevel.WARN);

  /**
   * Log error message
   */
  error = this.createLogMethod(LogLevel.ERROR);

  /**
   * Create a logging method for a specific log level
   */
  private createLogMethod(level: LogLevel) {
    return (
      message: string,
      context?: string,
      data?: Record<string, unknown>
    ): void => {
      this.log(level, message, context, data);
    };
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

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data: this.sanitizeData(data),
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Maintain max log limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console
    this.outputToConsole(entry);
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

    const logArgs = entry.data ? [fullMessage, entry.data] : [fullMessage];

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(...logArgs);
        break;
      case LogLevel.INFO:
        console.info(...logArgs);
        break;
      case LogLevel.WARN:
        console.warn(...logArgs);
        break;
      case LogLevel.ERROR:
        console.error(...logArgs);
        break;
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(
    count: number = LoggingConfig.LIMITS.RECENT_LOGS_COUNT
  ): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}
