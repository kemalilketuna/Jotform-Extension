/**
 * Centralized logging configuration for the extension
 * Manages log levels, limits, and formatting settings
 */
export class LoggingConfig {
  // Log levels
  static readonly LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
  } as const;

  // Log limits
  static readonly LIMITS = {
    MAX_LOGS: 1000,
    RECENT_LOGS_COUNT: 50,
    MAX_MESSAGE_LENGTH: 500,
  } as const;

  // Log categories
  static readonly CATEGORIES = {
    AUTOMATION: 'Automation',
    API: 'API',
    DOM: 'DOM',
    AUDIO: 'Audio',
    UI: 'UI',
    TYPING: 'Typing',
    CURSOR: 'Cursor',
    STORAGE: 'Storage',
    MESSAGING: 'Messaging',
    ERROR_HANDLER: 'ErrorHandler',
    ELEMENT_UTILS: 'ElementUtils',
    BACKGROUND: 'Background',
    CONTENT_SCRIPT: 'ContentScript',
    POPUP: 'Popup',
  } as const;

  // Log formatting
  static readonly FORMATTING = {
    TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ss',
    INCLUDE_TIMESTAMP: true,
    INCLUDE_LEVEL: true,
    INCLUDE_CATEGORY: true,
    INCLUDE_STACK_TRACE: true, // For errors
  } as const;

  // Console styling
  static readonly CONSOLE_STYLES = {
    DEBUG: 'color: #888; font-style: italic;',
    INFO: 'color: #2196F3; font-weight: bold;',
    WARN: 'color: #FF9800; font-weight: bold;',
    ERROR:
      'color: #F44336; font-weight: bold; background: #ffebee; padding: 2px 4px;',
  } as const;

  // Log persistence settings
  static readonly PERSISTENCE = {
    ENABLED: true,
    STORAGE_KEY: 'extension_logs',
    AUTO_CLEANUP: true,
    CLEANUP_THRESHOLD: 800, // Clean up when logs exceed this number
  } as const;

  // Performance logging
  static readonly PERFORMANCE = {
    TRACK_TIMING: true,
    LOG_SLOW_OPERATIONS: true,
    SLOW_OPERATION_THRESHOLD: 1000, // ms
    INCLUDE_MEMORY_USAGE: false, // Can be expensive
  } as const;

  /**
   * Get log level priority for filtering
   */
  static getLevelPriority(level: string): number {
    switch (level) {
      case this.LEVELS.DEBUG:
        return 0;
      case this.LEVELS.INFO:
        return 1;
      case this.LEVELS.WARN:
        return 2;
      case this.LEVELS.ERROR:
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Check if log level should be displayed
   */
  static shouldLog(
    level: string,
    minLevel: string = this.LEVELS.INFO
  ): boolean {
    return this.getLevelPriority(level) >= this.getLevelPriority(minLevel);
  }

  /**
   * Get console style for log level
   */
  static getConsoleStyle(level: string): string {
    switch (level) {
      case this.LEVELS.DEBUG:
        return this.CONSOLE_STYLES.DEBUG;
      case this.LEVELS.INFO:
        return this.CONSOLE_STYLES.INFO;
      case this.LEVELS.WARN:
        return this.CONSOLE_STYLES.WARN;
      case this.LEVELS.ERROR:
        return this.CONSOLE_STYLES.ERROR;
      default:
        return this.CONSOLE_STYLES.INFO;
    }
  }

  /**
   * Truncate message if it exceeds max length
   */
  static truncateMessage(message: string): string {
    if (message.length <= this.LIMITS.MAX_MESSAGE_LENGTH) {
      return message;
    }
    return message.substring(0, this.LIMITS.MAX_MESSAGE_LENGTH) + '...';
  }

  /**
   * Format timestamp for logs
   */
  static formatTimestamp(date: Date = new Date()): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Check if logs need cleanup
   */
  static needsCleanup(currentLogCount: number): boolean {
    return (
      this.PERSISTENCE.AUTO_CLEANUP &&
      currentLogCount > this.PERSISTENCE.CLEANUP_THRESHOLD
    );
  }

  /**
   * Get maximum logs to keep after cleanup
   */
  static getCleanupTarget(): number {
    return this.LIMITS.MAX_LOGS;
  }

  /**
   * Check if operation is considered slow
   */
  static isSlowOperation(duration: number): boolean {
    return (
      this.PERFORMANCE.LOG_SLOW_OPERATIONS &&
      duration > this.PERFORMANCE.SLOW_OPERATION_THRESHOLD
    );
  }

  /**
   * Get recent logs count for retrieval
   */
  static getRecentLogsCount(): number {
    return this.LIMITS.RECENT_LOGS_COUNT;
  }
}
