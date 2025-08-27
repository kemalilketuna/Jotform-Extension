import { VisualAnimationConfig } from '@/types/AutomationTypes';

/**
 * Configuration constants for visual cursor animations
 */
export class VisualCursorConfig {
  static readonly DEFAULT_ANIMATION_CONFIG: VisualAnimationConfig = {
    enabled: true,
    animationSpeed: 2, // 2ms per pixel (smooth but fast)
    hoverDuration: 800, // 800ms hover before click
    clickDuration: 300, // 300ms click animation
  } as const;

  static readonly CURSOR_DIMENSIONS = {
    width: 20,
    height: 20,
    offsetX: 10,
    offsetY: 10,
  } as const;

  static readonly TIMING_CONSTANTS = {
    fadeTransition: 200,
    minAnimationDuration: 300,
    maxZIndex: 2147483647,
  } as const;

  static readonly DOM_ATTRIBUTES = {
    cursorId: 'jotform-automation-cursor',
    styleId: 'jotform-cursor-styles',
    dataAttribute: 'data-jotform-extension',
    role: 'presentation',
    ariaHidden: 'true',
  } as const;

  static readonly CSS_CLASSES = {
    hover: 'cursor-hover',
    clicking: 'cursor-clicking',
  } as const;
}
