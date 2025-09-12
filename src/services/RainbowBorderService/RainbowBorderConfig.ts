/**
 * Configuration constants for RainbowBorderService
 * Centralized configuration for rainbow border behavior and styling
 */
export class RainbowBorderConfig {
  // Animation Timing
  static readonly DEFAULT_DURATION = 3000 as const; // 3 seconds
  static readonly ANIMATION_DURATION = '2s' as const;
  static readonly ANIMATION_CYCLE_MS = 2000 as const;

  // Visual Properties
  static readonly BORDER_WIDTH = '3px' as const;
  static readonly BORDER_RADIUS = '8px' as const;
  static readonly GLOW_EFFECT =
    '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)' as const;

  // Rainbow Gradient
  static readonly RAINBOW_GRADIENT =
    'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)' as const;

  // Z-Index Management
  static readonly BASE_Z_INDEX = 999998 as const;
  static readonly MAX_Z_INDEX = 999999 as const;

  // Performance Settings
  static readonly MAX_CONCURRENT_BORDERS = 5 as const;
  static readonly CLEANUP_INTERVAL_MS = 100 as const;

  // Accessibility
  static readonly REDUCED_MOTION_DURATION = '0.5s' as const;
  static readonly REDUCED_MOTION_GRADIENT =
    'linear-gradient(45deg, #4f46e5, #7c3aed)' as const;

  /**
   * Get animation duration based on user's motion preferences
   */
  static getAnimationDuration(): string {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );
      return prefersReducedMotion.matches
        ? RainbowBorderConfig.REDUCED_MOTION_DURATION
        : RainbowBorderConfig.ANIMATION_DURATION;
    }
    return RainbowBorderConfig.ANIMATION_DURATION;
  }

  /**
   * Get gradient based on user's motion preferences
   */
  static getGradient(): string {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      );
      return prefersReducedMotion.matches
        ? RainbowBorderConfig.REDUCED_MOTION_GRADIENT
        : RainbowBorderConfig.RAINBOW_GRADIENT;
    }
    return RainbowBorderConfig.RAINBOW_GRADIENT;
  }
}
