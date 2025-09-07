/**
 * Centralized UI configuration for the extension
 * Manages dimensions, colors, z-index values, and CSS properties
 */
export class UIConfig {
  // Extension dimensions
  static readonly POPUP_WIDTH = 360 as const;
  static readonly POPUP_MAX_HEIGHT = 600 as const;
  static readonly AI_TEXT_FIELD_WIDTH = 320 as const; // 80 * 0.25rem = 320px
  static readonly CHATBOX_WIDTH = 320 as const; // 80 * 0.25rem = 320px
  static readonly CHATBOX_MIN_HEIGHT = 200 as const;

  // Z-index hierarchy
  static readonly Z_INDEX = {
    EXTENSION_BASE: 999998,
    EXTENSION_TOP: 999999,
    CURSOR_MAX: 2147483647,
    USER_INTERACTION_BLOCKER: 999998,
  } as const;

  // Cursor configuration
  static readonly CURSOR = {
    WIDTH: 20,
    HEIGHT: 20,
    OFFSET_X: 10,
    OFFSET_Y: 10,
    BORDER_RADIUS: 50, // percentage
  } as const;

  // Color system
  static readonly COLORS = {
    // Status colors
    SUCCESS: 'bg-green-500',
    WARNING: 'bg-yellow-500',
    ERROR: 'bg-red-500',
    INFO: 'bg-blue-500',
    NEUTRAL: 'bg-gray-500',

    // Connection status
    CONNECTED: 'bg-green-500',
    CONNECTING: 'bg-yellow-500',
    DISCONNECTED: 'bg-red-500',
    RETRYING: 'bg-orange-500',

    // Message status backgrounds
    STATUS_BLUE: 'text-blue-600 bg-blue-50',
    STATUS_GREEN: 'text-green-600 bg-green-50',
    STATUS_RED: 'text-red-600 bg-red-50',
    STATUS_GRAY: 'text-gray-600 bg-gray-50',

    // Button colors
    PRIMARY_BUTTON: 'bg-blue-500 hover:bg-blue-600',
    SUCCESS_BUTTON: 'bg-green-600 hover:bg-green-700',
    DANGER_BUTTON: 'bg-red-600 hover:bg-red-700',
  } as const;

  // Spacing and sizing
  static readonly SPACING = {
    POPUP_PADDING: 'p-5',
    COMPONENT_MARGIN: 'mb-4',
    BUTTON_PADDING: 'py-2.5 px-4',
    INPUT_PADDING: 'px-4 py-3 pr-12',
    CARD_PADDING: 'p-3',
    SMALL_PADDING: 'p-2',
  } as const;

  // Border radius
  static readonly BORDER_RADIUS = {
    SMALL: 'rounded',
    MEDIUM: 'rounded-lg',
    LARGE: 'rounded-xl',
    FULL: 'rounded-full',
  } as const;

  // Typography
  static readonly TYPOGRAPHY = {
    HEADER_SIZE: 'text-lg',
    BODY_SIZE: 'text-sm',
    SMALL_SIZE: 'text-xs',
    FONT_WEIGHT_NORMAL: 'font-normal',
    FONT_WEIGHT_MEDIUM: 'font-medium',
    OPACITY_HIGH: 'opacity-90',
    OPACITY_MEDIUM: 'opacity-70',
    OPACITY_LOW: 'opacity-50',
  } as const;

  // Positioning
  static readonly POSITIONING = {
    FIXED_BOTTOM_RIGHT: 'fixed bottom-5 right-5',
    FIXED_BOTTOM_RIGHT_OFFSET: 'fixed bottom-24 right-5',
    ABSOLUTE_CENTER:
      'absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2',
    ABSOLUTE_RIGHT: 'absolute right-2 top-1/2 -translate-y-1/2',
  } as const;

  // Transitions and animations
  static readonly TRANSITIONS = {
    DEFAULT: 'transition-all duration-300',
    FAST: 'transition-all duration-200',
    SLOW: 'transition-all duration-500',
    COLORS_ONLY: 'transition-colors duration-200',
  } as const;

  // Shadow effects
  static readonly SHADOWS = {
    SMALL: 'shadow-sm',
    MEDIUM: 'shadow-lg',
    LARGE: 'shadow-xl',
    CURSOR_GLOW: '0 3px 12px rgba(74, 144, 226, 0.4)',
  } as const;

  // Focus states
  static readonly FOCUS = {
    RING_PRIMARY: 'focus:ring-2 focus:ring-blue-400',
    RING_SUCCESS: 'focus:ring-2 focus:ring-green-500/50',
    RING_DANGER: 'focus:ring-2 focus:ring-red-500/50',
    OUTLINE_NONE: 'focus:outline-none',
  } as const;

  // Text truncation limits
  static readonly TEXT_LIMITS = {
    ELEMENT_TEXT_PREVIEW: 50,
    ERROR_TEXT_PREVIEW: 50,
    OBJECTIVE_MAX_LENGTH: 1000,
  } as const;

  // Audio volume settings
  static readonly AUDIO = {
    OVERLAP_VOLUME_REDUCTION: 0.7, // 30% reduction for overlapping sounds
    DEFAULT_VOLUME: 1.0,
  } as const;

  /**
   * Get status color class based on status type
   */
  static getStatusColor(
    status: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  ): string {
    switch (status) {
      case 'success':
        return this.COLORS.SUCCESS;
      case 'warning':
        return this.COLORS.WARNING;
      case 'error':
        return this.COLORS.ERROR;
      case 'info':
        return this.COLORS.INFO;
      default:
        return this.COLORS.NEUTRAL;
    }
  }

  /**
   * Get connection status color
   */
  static getConnectionStatusColor(
    status: 'connected' | 'connecting' | 'disconnected' | 'retrying'
  ): string {
    switch (status) {
      case 'connected':
        return this.COLORS.CONNECTED;
      case 'connecting':
        return this.COLORS.CONNECTING;
      case 'retrying':
        return this.COLORS.RETRYING;
      default:
        return this.COLORS.DISCONNECTED;
    }
  }

  /**
   * Get message status styling
   */
  static getMessageStatusStyling(
    status: 'info' | 'success' | 'error' | 'default'
  ): string {
    switch (status) {
      case 'info':
        return this.COLORS.STATUS_BLUE;
      case 'success':
        return this.COLORS.STATUS_GREEN;
      case 'error':
        return this.COLORS.STATUS_RED;
      default:
        return this.COLORS.STATUS_GRAY;
    }
  }

  /**
   * Generate complete button class string
   */
  static getButtonClasses(
    variant: 'primary' | 'success' | 'danger',
    size: 'normal' | 'small' = 'normal'
  ): string {
    const baseClasses =
      'font-medium rounded-lg transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
    const sizeClasses =
      size === 'small' ? 'py-2 px-3 text-sm' : this.SPACING.BUTTON_PADDING;

    let colorClasses: string;
    switch (variant) {
      case 'success':
        colorClasses = `${this.COLORS.SUCCESS_BUTTON} text-white ${this.FOCUS.RING_SUCCESS}`;
        break;
      case 'danger':
        colorClasses = `${this.COLORS.DANGER_BUTTON} text-white ${this.FOCUS.RING_DANGER}`;
        break;
      default:
        colorClasses = `${this.COLORS.PRIMARY_BUTTON} text-white ${this.FOCUS.RING_PRIMARY}`;
    }

    return `${baseClasses} ${sizeClasses} ${colorClasses}`;
  }
}
