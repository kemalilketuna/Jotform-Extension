import { LoggingService } from '@/services/LoggingService';
import { SingletonManager } from '@/utils/SingletonService';
import { RainbowBorderStrings } from './RainbowBorderStrings';
import { RainbowBorderConfig } from './RainbowBorderConfig';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Service for adding temporary rainbow borders to HTML elements during automation
 * Provides visual feedback to users about which element is being targeted
 */
export class RainbowBorderService {
  private readonly logger: LoggingService;
  private readonly activeElements = new Map<HTMLElement, string>();
  private animationFrameId: number | null = null;
  private stylesInjected: boolean = false;

  private constructor(logger?: LoggingService) {
    this.logger = logger || LoggingService.getInstance();
  }

  /**
   * Get singleton instance of RainbowBorderService
   */
  static getInstance(logger?: LoggingService): RainbowBorderService {
    return SingletonManager.getInstance(
      'RainbowBorderService',
      () => new RainbowBorderService(logger)
    );
  }

  /**
   * Add temporary rainbow border to an element
   */
  async addRainbowBorder(
    element: HTMLElement,
    duration: number = RainbowBorderConfig.DEFAULT_DURATION
  ): Promise<void> {
    const config: ErrorHandlingConfig = {
      context: 'RainbowBorderService',
      operation: 'addRainbowBorder',
      logLevel: 'warn',
    };

    await ErrorHandlingUtils.safeExecute(
      async () => {
        this.logger.debug(
          `Adding rainbow border to ${element.tagName} for ${duration}ms`,
          'RainbowBorderService'
        );

        // Ensure CSS is injected into the page
        this.ensureStylesInjected();

        // Apply rainbow border styles (this will store original classes internally)
        this.applyRainbowBorderStyles(element);

        // Start animation if not already running
        if (!this.animationFrameId) {
          this.startAnimation();
        }

        // Remove border after specified duration
        setTimeout(() => {
          this.removeRainbowBorder(element);
        }, duration);
      },
      undefined,
      config,
      this.logger
    );
  }

  /**
   * Remove rainbow border from specific element
   */
  async removeRainbowBorder(element: HTMLElement): Promise<void> {
    const config: ErrorHandlingConfig = {
      context: 'RainbowBorderService',
      operation: 'removeRainbowBorder',
      logLevel: 'warn',
    };

    await ErrorHandlingUtils.safeExecute(
      async () => {
        const originalStylesJson = this.activeElements.get(element);
        if (!originalStylesJson) {
          return;
        }

        this.logger.debug(
          `Removing rainbow border from ${element.tagName}`,
          'RainbowBorderService'
        );

        // Remove rainbow border CSS class
        element.classList.remove(RainbowBorderStrings.RAINBOW_BORDER_CLASS);
        element.classList.remove(RainbowBorderStrings.RAINBOW_GLOW_CLASS);

        // Restore original styles
        try {
          const originalStyles = JSON.parse(originalStylesJson);
          element.style.border = originalStyles.border || '';
          element.style.borderRadius = originalStyles.borderRadius || '';
          element.style.boxShadow = originalStyles.boxShadow || '';
          element.style.zIndex = originalStyles.zIndex || '';
          element.style.position = originalStyles.position || '';
        } catch (error) {
          this.logger.warn(
            `Failed to restore original styles for ${element.tagName}: ${error}`,
            'RainbowBorderService'
          );
        }

        // Remove from active elements
        this.activeElements.delete(element);

        // Stop animation if no more active elements
        if (this.activeElements.size === 0 && this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
      },
      undefined,
      config,
      this.logger
    );
  }

  /**
   * Remove all rainbow borders
   */
  async removeAllRainbowBorders(): Promise<void> {
    const config: ErrorHandlingConfig = {
      context: 'RainbowBorderService',
      operation: 'removeAllRainbowBorders',
      logLevel: 'warn',
    };

    await ErrorHandlingUtils.safeExecute(
      async () => {
        this.logger.debug(
          `Removing all rainbow borders (${this.activeElements.size} elements)`,
          'RainbowBorderService'
        );

        const elementsToRemove = Array.from(this.activeElements.keys());
        for (const element of elementsToRemove) {
          await this.removeRainbowBorder(element);
        }
      },
      undefined,
      config,
      this.logger
    );
  }

  /**
   * Apply rainbow border styles to element using CSS classes
   */
  private applyRainbowBorderStyles(element: HTMLElement): void {
    // Store original border and styles for restoration
    const originalStyles = {
      border: element.style.border,
      borderRadius: element.style.borderRadius,
      boxShadow: element.style.boxShadow,
      zIndex: element.style.zIndex,
      position: element.style.position,
    };
    this.activeElements.set(element, JSON.stringify(originalStyles));

    // Add rainbow border CSS class for consistent styling
    element.classList.add(RainbowBorderStrings.RAINBOW_BORDER_CLASS);

    // Ensure element is visible with proper z-index
    const currentZIndex = parseInt(element.style.zIndex) || 0;
    if (currentZIndex < RainbowBorderConfig.BASE_Z_INDEX) {
      element.style.zIndex = String(RainbowBorderConfig.BASE_Z_INDEX);
    }

    // Ensure element has position for z-index to work
    if (!element.style.position || element.style.position === 'static') {
      element.style.position = 'relative';
    }
  }

  /**
   * Start the rainbow border animation
   */
  private startAnimation(): void {
    const animate = () => {
      // Update animation for all active elements
      this.activeElements.forEach((_, element) => {
        if (document.contains(element)) {
          // Element still exists in DOM, continue animation
          this.updateRainbowAnimation(element);
        } else {
          // Element removed from DOM, clean up
          this.activeElements.delete(element);
        }
      });

      // Continue animation if there are active elements
      if (this.activeElements.size > 0) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Update rainbow animation for a specific element
   */
  private updateRainbowAnimation(element: HTMLElement): void {
    // The CSS animation handles the rainbow effect
    // This method can be used for additional dynamic updates if needed
    const currentTime = Date.now();
    const animationProgress =
      (currentTime % RainbowBorderConfig.ANIMATION_CYCLE_MS) /
      RainbowBorderConfig.ANIMATION_CYCLE_MS;

    // Optional: Add pulsing effect based on animation progress
    const pulseIntensity =
      0.8 + 0.2 * Math.sin(animationProgress * Math.PI * 2);
    element.style.opacity = String(pulseIntensity);
  }

  /**
   * Check if element has active rainbow border
   */
  hasRainbowBorder(element: HTMLElement): boolean {
    return this.activeElements.has(element);
  }

  /**
   * Get count of elements with active rainbow borders
   */
  getActiveElementCount(): number {
    return this.activeElements.size;
  }

  /**
   * Debug method: Test rainbow border on first button found on page
   */
  async testRainbowBorder(): Promise<boolean> {
    const button = document.querySelector('button');
    if (button instanceof HTMLElement) {
      this.logger.info(
        'Testing rainbow border on first button found',
        'RainbowBorderService'
      );
      await this.addRainbowBorder(button, 5000); // 5 seconds for testing
      return true;
    } else {
      this.logger.warn(
        'No button found for testing rainbow border',
        'RainbowBorderService'
      );
      return false;
    }
  }

  /**
   * Cleanup service and remove all borders
   */
  async cleanup(): Promise<void> {
    this.logger.debug(
      'Cleaning up RainbowBorderService',
      'RainbowBorderService'
    );
    await this.removeAllRainbowBorders();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove injected styles
    this.removeInjectedStyles();
  }

  /**
   * Ensure CSS styles are injected into the page
   */
  private ensureStylesInjected(): void {
    if (this.stylesInjected) {
      return;
    }

    const styleId = 'jotform-extension-rainbow-border-styles';
    if (document.getElementById(styleId)) {
      this.stylesInjected = true;
      return;
    }

    try {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = this.getRainbowBorderCSS();
      document.head.appendChild(style);
      this.stylesInjected = true;

      this.logger.debug(
        'Rainbow border CSS injected into page',
        'RainbowBorderService'
      );
    } catch (error) {
      this.logger.error(
        `Failed to inject rainbow border CSS: ${error}`,
        'RainbowBorderService'
      );
    }
  }

  /**
   * Remove injected CSS styles from the page
   */
  private removeInjectedStyles(): void {
    const styleId = 'jotform-extension-rainbow-border-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
      this.stylesInjected = false;
      this.logger.debug(
        'Rainbow border CSS removed from page',
        'RainbowBorderService'
      );
    }
  }

  /**
   * Get the CSS styles for rainbow border animation
   */
  private getRainbowBorderCSS(): string {
    return `
      .${RainbowBorderStrings.RAINBOW_BORDER_CLASS} {
        position: relative !important;
        box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #ff0000 !important;
        animation: ${RainbowBorderStrings.ANIMATION_NAME} ${RainbowBorderConfig.getAnimationDuration()} linear infinite !important;
      }

      @keyframes ${RainbowBorderStrings.ANIMATION_NAME} {
        0% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #ff0000 !important;
        }
        8.33% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #ff8000 !important;
        }
        16.66% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #ffff00 !important;
        }
        25% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #80ff00 !important;
        }
        33.33% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #00ff00 !important;
        }
        41.66% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #00ff80 !important;
        }
        50% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #00ffff !important;
        }
        58.33% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #0080ff !important;
        }
        66.66% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #0000ff !important;
        }
        75% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #8000ff !important;
        }
        83.33% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #ff00ff !important;
        }
        91.66% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #ff0080 !important;
        }
        100% { 
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #ff0000 !important;
        }
      }

      /* Reduced motion accessibility */
      @media (prefers-reduced-motion: reduce) {
        .${RainbowBorderStrings.RAINBOW_BORDER_CLASS} {
          animation: none !important;
          box-shadow: 0 0 0 ${RainbowBorderConfig.BORDER_WIDTH} #4f46e5 !important;
        }
      }
    `;
  }
}
