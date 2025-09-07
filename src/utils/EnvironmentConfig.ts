/**
 * Environment configuration utility class that manages environment variables
 * following the OOP string management pattern
 */

export class EnvironmentVariableNames {
  static readonly BACKEND_BASE_URL = 'BACKEND_BASE_URL' as const;
  static readonly DEBUG_LOG_LEVEL = 'DEBUG_LOG_LEVEL' as const;
}

export class EnvironmentDefaults {
  static readonly BACKEND_BASE_URL = 'http://localhost:8000' as const;
  static readonly DEBUG_LOG_LEVEL = '0' as const;
}

export class EnvironmentErrors {
  static readonly INVALID_LOG_LEVEL =
    'Invalid log level value. Must be 0-3.' as const;
  static readonly INVALID_URL = 'Invalid backend base URL format.' as const;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private readonly config: Map<string, string> = new Map();

  private constructor() {
    this.loadEnvironmentVariables();
  }

  static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private loadEnvironmentVariables(): void {
    // Load from process.env if available (Node.js environment)
    if (typeof process !== 'undefined' && process.env) {
      this.config.set(
        EnvironmentVariableNames.BACKEND_BASE_URL,
        process.env[EnvironmentVariableNames.BACKEND_BASE_URL] ||
          EnvironmentDefaults.BACKEND_BASE_URL
      );
      this.config.set(
        EnvironmentVariableNames.DEBUG_LOG_LEVEL,
        process.env[EnvironmentVariableNames.DEBUG_LOG_LEVEL] ||
          EnvironmentDefaults.DEBUG_LOG_LEVEL
      );
    } else {
      // Fallback to defaults in browser environment
      this.config.set(
        EnvironmentVariableNames.BACKEND_BASE_URL,
        EnvironmentDefaults.BACKEND_BASE_URL
      );
      this.config.set(
        EnvironmentVariableNames.DEBUG_LOG_LEVEL,
        EnvironmentDefaults.DEBUG_LOG_LEVEL
      );
    }
  }

  getBackendBaseUrl(): string {
    const url =
      this.config.get(EnvironmentVariableNames.BACKEND_BASE_URL) ||
      EnvironmentDefaults.BACKEND_BASE_URL;
    this.validateUrl(url);
    return url;
  }

  getDebugLogLevel(): LogLevel {
    const levelStr =
      this.config.get(EnvironmentVariableNames.DEBUG_LOG_LEVEL) ||
      EnvironmentDefaults.DEBUG_LOG_LEVEL;
    const level = parseInt(levelStr, 10);
    this.validateLogLevel(level);
    return level as LogLevel;
  }

  private validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error(EnvironmentErrors.INVALID_URL);
    }
  }

  private validateLogLevel(level: number): void {
    if (!Number.isInteger(level) || level < 0 || level > 3) {
      throw new Error(EnvironmentErrors.INVALID_LOG_LEVEL);
    }
  }

  // For testing purposes
  setConfigValue(key: string, value: string): void {
    this.config.set(key, value);
  }

  // Reset singleton for testing
  static resetInstance(): void {
    EnvironmentConfig.instance = undefined as any;
  }
}
