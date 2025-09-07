/**
 * Centralized extension configuration
 * Manages extension-wide settings, identifiers, and metadata
 */
export class ExtensionConfig {
  // Extension metadata
  static readonly METADATA = {
    NAME: 'Jotform AI Automation Extension',
    VERSION: '1.0.0',
    DESCRIPTION: 'AI-powered automation for Jotform workflows',
  } as const;

  // Extension component identifiers
  static readonly COMPONENTS = {
    EXTENSION_COMPONENT_CLASS: 'jotform-ai-extension-component',
    CONTENT_SCRIPT_ID_PREFIX: 'content-script-',
    MESSAGE_ID_PREFIX: 'msg-',
  } as const;

  // Storage keys
  static readonly STORAGE_KEYS = {
    LOGS: 'extension_logs',
    USER_PREFERENCES: 'user_preferences',
    AUTOMATION_STATE: 'automation_state',
    API_CONFIG: 'api_config',
    AUDIO_SETTINGS: 'audio_settings',
  } as const;

  // Message types for extension communication
  static readonly MESSAGE_TYPES = {
    AUTOMATION_START: 'automation_start',
    AUTOMATION_STOP: 'automation_stop',
    AUTOMATION_STATUS: 'automation_status',
    DOM_ANALYSIS: 'dom_analysis',
    ACTION_EXECUTE: 'action_execute',
    ERROR_REPORT: 'error_report',
    LOG_MESSAGE: 'log_message',
    HEALTH_CHECK: 'health_check',
  } as const;

  // Environment settings
  static readonly ENVIRONMENT = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TESTING: 'testing',
  } as const;

  // Feature flags
  static readonly FEATURES = {
    AUDIO_FEEDBACK: true,
    VISUAL_CURSOR: true,
    DEBUG_LOGGING: true,
    ERROR_REPORTING: true,
    PERFORMANCE_MONITORING: false,
    ANALYTICS: false,
  } as const;

  // Browser compatibility
  static readonly BROWSERS = {
    CHROME: 'chrome',
    FIREFOX: 'firefox',
    SAFARI: 'safari',
    EDGE: 'edge',
  } as const;

  // Permissions required by the extension
  static readonly PERMISSIONS = {
    ACTIVE_TAB: 'activeTab',
    STORAGE: 'storage',
    SCRIPTING: 'scripting',
    HOST_PERMISSIONS: ['*://*.jotform.com/*'],
  } as const;

  // Content Security Policy settings
  static readonly CSP = {
    SCRIPT_SRC: "'self' 'unsafe-inline'",
    STYLE_SRC: "'self' 'unsafe-inline'",
    IMG_SRC: "'self' data: https:",
    CONNECT_SRC: "'self' http://localhost:* https:",
  } as const;

  // Rate limiting
  static readonly RATE_LIMITS = {
    API_REQUESTS_PER_MINUTE: 60,
    AUTOMATION_ACTIONS_PER_MINUTE: 30,
    LOG_ENTRIES_PER_SECOND: 10,
  } as const;

  /**
   * Generate unique content script ID
   */
  static generateContentScriptId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.COMPONENTS.CONTENT_SCRIPT_ID_PREFIX}${timestamp}-${random}`;
  }

  /**
   * Generate unique message ID
   */
  static generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.COMPONENTS.MESSAGE_ID_PREFIX}${timestamp}-${random}`;
  }

  /**
   * Check if feature is enabled
   */
  static isFeatureEnabled(
    feature: keyof typeof ExtensionConfig.FEATURES
  ): boolean {
    return this.FEATURES[feature];
  }

  /**
   * Get current environment
   */
  static getCurrentEnvironment(): string {
    // In a real implementation, this would check actual environment
    return process.env.NODE_ENV === 'production'
      ? this.ENVIRONMENT.PRODUCTION
      : this.ENVIRONMENT.DEVELOPMENT;
  }

  /**
   * Check if running in development mode
   */
  static isDevelopment(): boolean {
    return this.getCurrentEnvironment() === this.ENVIRONMENT.DEVELOPMENT;
  }

  /**
   * Check if running in production mode
   */
  static isProduction(): boolean {
    return this.getCurrentEnvironment() === this.ENVIRONMENT.PRODUCTION;
  }

  /**
   * Get extension component class selector
   */
  static getComponentSelector(): string {
    return `.${this.COMPONENTS.EXTENSION_COMPONENT_CLASS}`;
  }

  /**
   * Get extension component class attribute
   */
  static getComponentClass(): string {
    return this.COMPONENTS.EXTENSION_COMPONENT_CLASS;
  }

  /**
   * Check if message type is valid
   */
  static isValidMessageType(messageType: string): boolean {
    return Object.values(this.MESSAGE_TYPES).includes(
      messageType as (typeof this.MESSAGE_TYPES)[keyof typeof this.MESSAGE_TYPES]
    );
  }

  /**
   * Get rate limit for specific operation
   */
  static getRateLimit(operation: 'api' | 'automation' | 'logging'): number {
    switch (operation) {
      case 'api':
        return this.RATE_LIMITS.API_REQUESTS_PER_MINUTE;
      case 'automation':
        return this.RATE_LIMITS.AUTOMATION_ACTIONS_PER_MINUTE;
      case 'logging':
        return this.RATE_LIMITS.LOG_ENTRIES_PER_SECOND;
      default:
        return this.RATE_LIMITS.API_REQUESTS_PER_MINUTE;
    }
  }

  /**
   * Get storage key for specific data type
   */
  static getStorageKey(
    dataType: keyof typeof ExtensionConfig.STORAGE_KEYS
  ): string {
    return this.STORAGE_KEYS[dataType];
  }
}
