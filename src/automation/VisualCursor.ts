import {
  CursorPosition,
  VisualAnimationConfig,
  VisualCursorState,
} from '../types/AutomationTypes';
import { LoggingService } from '../services/LoggingService';

/**
 * Visual cursor component for showing automation actions to users
 */
export class VisualCursor {
  private static instance: VisualCursor;
  private readonly logger: LoggingService;
  private cursorElement: HTMLElement | null = null;
  private state: VisualCursorState;
  private config: VisualAnimationConfig;
  private animationTimeout: number | null = null;

  private constructor() {
    this.logger = LoggingService.getInstance();
    this.state = {
      isVisible: false,
      position: { x: 0, y: 0 },
      isAnimating: false,
      isHovering: false,
      isClicking: false,
    };
    this.config = {
      enabled: true,
      animationSpeed: 2, // 2ms per pixel (smooth but fast)
      hoverDuration: 800, // 800ms hover before click
      clickDuration: 300, // 300ms click animation
    };
  }

  static getInstance(): VisualCursor {
    if (!VisualCursor.instance) {
      VisualCursor.instance = new VisualCursor();
    }
    return VisualCursor.instance;
  }

  /**
   * Initialize the visual cursor in the DOM
   */
  initialize(): void {
    if (!this.config.enabled || this.cursorElement) {
      return;
    }

    this.createCursorElement();
    this.attachStyles();
    this.ensureStyleIsolation();
    this.logger.info('Visual cursor initialized', 'VisualCursor');
  }

  /**
   * Clean up the visual cursor
   */
  destroy(): void {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }

    if (this.cursorElement) {
      // Clean up mutation observer
      const observer = (this.cursorElement as any).__styleObserver;
      if (observer) {
        observer.disconnect();
        delete (this.cursorElement as any).__styleObserver;
      }

      this.cursorElement.remove();
      this.cursorElement = null;
    }

    // Clean up injected styles
    const styleElement = document.getElementById('jotform-cursor-styles');
    if (styleElement) {
      styleElement.remove();
    }

    this.state.isVisible = false;
    this.logger.debug('Visual cursor destroyed', 'VisualCursor');
  }

  /**
   * Show the cursor at a specific position
   */
  show(position?: CursorPosition): void {
    if (!this.config.enabled || !this.cursorElement) {
      return;
    }

    if (position) {
      this.state.position = position;
      this.updateCursorPosition();
    }

    // Ensure styles are properly applied before showing
    this.reapplyStyles();
    
    this.state.isVisible = true;
    this.cursorElement.style.display = 'block';
    this.cursorElement.style.opacity = '1';
    this.logger.debug(
      `Cursor shown at position (${this.state.position.x}, ${this.state.position.y})`,
      'VisualCursor'
    );
  }

  /**
   * Hide the cursor
   */
  hide(): void {
    if (!this.cursorElement) {
      return;
    }

    this.state.isVisible = false;
    this.cursorElement.style.opacity = '0';
    setTimeout(() => {
      if (this.cursorElement && !this.state.isVisible) {
        this.cursorElement.style.display = 'none';
      }
    }, 200);
    this.logger.debug('Cursor hidden', 'VisualCursor');
  }

  /**
   * Animate cursor movement to target element
   */
  async moveToElement(element: Element): Promise<void> {
    if (!this.config.enabled || !this.cursorElement || !element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const targetPosition: CursorPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    await this.animateToPosition(targetPosition);
  }

  /**
   * Perform visual click animation with hover effect
   */
  async performClick(): Promise<void> {
    if (!this.config.enabled || !this.cursorElement) {
      return;
    }

    this.logger.debug('Starting click animation sequence', 'VisualCursor');

    // Start hover animation
    await this.startHover();

    // Perform click animation
    await this.startClick();

    // End hover state
    this.endHover();
  }

  /**
   * Update animation configuration
   */
  updateConfig(config: Partial<VisualAnimationConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.debug('Visual cursor config updated', 'VisualCursor', {
      config: this.config,
    });
  }

  /**
   * Get current cursor state
   */
  getState(): VisualCursorState {
    return { ...this.state };
  }

  /**
   * Create the cursor DOM element
   */
  private createCursorElement(): void {
    this.cursorElement = document.createElement('div');
    this.cursorElement.id = 'jotform-automation-cursor';
    this.cursorElement.innerHTML = `
            <div class="cursor-pointer"></div>
            <div class="cursor-click-ripple"></div>
        `;

    // Apply comprehensive style isolation
    const styles = {
      position: 'fixed',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      zIndex: '2147483647', // Maximum z-index value
      display: 'none',
      transition: 'opacity 0.2s ease',
      width: '20px',
      height: '20px',
      margin: '0',
      padding: '0',
      border: 'none',
      background: 'transparent',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      lineHeight: '1',
      color: 'initial',
      textAlign: 'left',
      direction: 'ltr',
      unicodeBidi: 'normal',
      whiteSpace: 'normal',
      wordSpacing: 'normal',
      letterSpacing: 'normal',
      textTransform: 'none',
      textIndent: '0',
      textShadow: 'none',
      userSelect: 'none',
      webkitUserSelect: 'none',
      mozUserSelect: 'none',
      msUserSelect: 'none',
      overflow: 'visible',
      opacity: '1',
      visibility: 'visible',
      animation: 'none',
      filter: 'none',
      backdropFilter: 'none',
      clip: 'auto',
      clipPath: 'none',
      mask: 'none',
      mixBlendMode: 'normal'
    };

    // Apply all styles with proper typing
    Object.entries(styles).forEach(([property, value]) => {
      (this.cursorElement!.style as any)[property] = value;
    });

    // Ensure the element is isolated from page styles
    this.cursorElement.setAttribute('data-jotform-extension', 'true');
    this.cursorElement.setAttribute('role', 'presentation');
    this.cursorElement.setAttribute('aria-hidden', 'true');

    // Set initial transform position
    this.updateCursorPosition();

    document.body.appendChild(this.cursorElement);
  }

  /**
   * Attach CSS styles for cursor animations
   */
  private attachStyles(): void {
    const styleId = 'jotform-cursor-styles';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
            /* Isolated styles for JotForm automation cursor */
            #jotform-automation-cursor {
                width: 20px !important;
                height: 20px !important;
                /* DO NOT use !important on transform - it breaks animations */
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                font-size: 14px !important;
                line-height: 1 !important;
                color: initial !important;
                background: transparent !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
                text-align: left !important;
                direction: ltr !important;
                unicode-bidi: normal !important;
                white-space: normal !important;
                word-spacing: normal !important;
                letter-spacing: normal !important;
                text-transform: none !important;
                text-indent: 0 !important;
                text-shadow: none !important;
                display: block !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: auto !important;
                bottom: auto !important;
                z-index: 2147483647 !important;
                pointer-events: none !important;
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
            }

            #jotform-automation-cursor .cursor-pointer {
                width: 20px !important;
                height: 20px !important;
                background: linear-gradient(45deg, #4A90E2, #357ABD) !important;
                border: 2px solid white !important;
                border-radius: 50% !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
                transition: all 0.2s ease !important;
                position: relative !important;
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
                float: none !important;
                clear: none !important;
                overflow: visible !important;
                opacity: 1 !important;
                visibility: visible !important;
                transform: none !important;
                animation: none !important;
                filter: none !important;
                backdrop-filter: none !important;
                clip: auto !important;
                clip-path: none !important;
                mask: none !important;
                mix-blend-mode: normal !important;
            }

            #jotform-automation-cursor .cursor-pointer::before {
                content: '' !important;
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                width: 8px !important;
                height: 8px !important;
                background: white !important;
                border-radius: 50% !important;
                transform: translate(-50%, -50%) !important;
                opacity: 0.8 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                display: block !important;
                z-index: 1 !important;
            }

            #jotform-automation-cursor.cursor-hover .cursor-pointer {
                transform: scale(1.2) !important;
                background: linear-gradient(45deg, #5BA0F2, #4A90E2) !important;
                box-shadow: 0 3px 12px rgba(74, 144, 226, 0.4) !important;
            }

            #jotform-automation-cursor.cursor-clicking .cursor-pointer {
                transform: scale(0.8) !important;
                background: linear-gradient(45deg, #357ABD, #2E6BA8) !important;
            }

            #jotform-automation-cursor .cursor-click-ripple {
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                width: 40px !important;
                height: 40px !important;
                background: radial-gradient(circle, rgba(74, 144, 226, 0.3) 0%, transparent 70%) !important;
                border-radius: 50% !important;
                transform: translate(-50%, -50%) scale(0) !important;
                opacity: 0 !important;
                transition: all 0.3s ease !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                display: block !important;
                pointer-events: none !important;
                z-index: 0 !important;
            }

            #jotform-automation-cursor.cursor-clicking .cursor-click-ripple {
                transform: translate(-50%, -50%) scale(1) !important;
                opacity: 1 !important;
            }
        `;

    document.head.appendChild(style);
  }

  /**
   * Update cursor position in DOM
   */
  private updateCursorPosition(): void {
    if (!this.cursorElement) {
      return;
    }

    this.cursorElement.style.transform = `translate(${this.state.position.x - 10}px, ${this.state.position.y - 10}px)`;
  }

  /**
   * Animate cursor to target position with smooth movement
   */
  private async animateToPosition(
    targetPosition: CursorPosition
  ): Promise<void> {
    if (!this.cursorElement || this.state.isAnimating) {
      return;
    }

    this.state.isAnimating = true;
    const startPosition = { ...this.state.position };
    const distance = Math.sqrt(
      Math.pow(targetPosition.x - startPosition.x, 2) +
        Math.pow(targetPosition.y - startPosition.y, 2)
    );

    const duration = Math.max(300, distance * this.config.animationSpeed);
    const startTime = Date.now();

    return new Promise<void>((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth easing function
        const easeProgress = this.easeInOutCubic(progress);

        this.state.position = {
          x:
            startPosition.x +
            (targetPosition.x - startPosition.x) * easeProgress,
          y:
            startPosition.y +
            (targetPosition.y - startPosition.y) * easeProgress,
        };

        this.updateCursorPosition();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.state.isAnimating = false;
          this.logger.debug('Cursor animation completed', 'VisualCursor');
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Start hover animation
   */
  private async startHover(): Promise<void> {
    if (!this.cursorElement) {
      return;
    }

    this.state.isHovering = true;
    this.cursorElement.classList.add('cursor-hover');

    return new Promise<void>((resolve) => {
      this.animationTimeout = window.setTimeout(() => {
        this.logger.debug('Hover animation completed', 'VisualCursor');
        resolve();
      }, this.config.hoverDuration);
    });
  }

  /**
   * Start click animation
   */
  private async startClick(): Promise<void> {
    if (!this.cursorElement) {
      return;
    }

    this.state.isClicking = true;
    this.cursorElement.classList.add('cursor-clicking');

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.state.isClicking = false;
        if (this.cursorElement) {
          this.cursorElement.classList.remove('cursor-clicking');
        }
        this.logger.debug('Click animation completed', 'VisualCursor');
        resolve();
      }, this.config.clickDuration);
    });
  }

  /**
   * End hover state
   */
  private endHover(): void {
    if (!this.cursorElement) {
      return;
    }

    this.state.isHovering = false;
    this.cursorElement.classList.remove('cursor-hover');
  }

  /**
   * Ensure the visual cursor is properly isolated from page styles
   */
  private ensureStyleIsolation(): void {
    if (!this.cursorElement) {
      return;
    }

    // Create a mutation observer to watch for style changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // Re-apply our styles if they've been modified
          this.reapplyStyles();
        }
      });
    });

    // Observe the cursor element for style changes
    observer.observe(this.cursorElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Store observer for cleanup
    (this.cursorElement as any).__styleObserver = observer;
  }

  /**
   * Re-apply critical styles to maintain visual cursor integrity
   */
  private reapplyStyles(): void {
    if (!this.cursorElement) {
      return;
    }

    // Critical styles that must never be overridden
    // Note: transform is managed by updateCursorPosition, not here
    const criticalStyles = {
      position: 'fixed',
      zIndex: '2147483647',
      pointerEvents: 'none',
      userSelect: 'none',
      webkitUserSelect: 'none',
      mozUserSelect: 'none',
      msUserSelect: 'none'
    };

    // Check for style conflicts before applying
    this.detectStyleConflicts(criticalStyles);

    Object.entries(criticalStyles).forEach(([property, value]) => {
      (this.cursorElement!.style as any)[property] = value;
    });
  }

  /**
   * Detect and log potential style conflicts
   */
  private detectStyleConflicts(expectedStyles: Record<string, string>): void {
    if (!this.cursorElement) {
      return;
    }

    const computedStyles = window.getComputedStyle(this.cursorElement);
    const conflicts: string[] = [];

    Object.entries(expectedStyles).forEach(([property, expectedValue]) => {
      const actualValue = (computedStyles as any)[property];
      if (actualValue && actualValue !== expectedValue) {
        conflicts.push(`${property}: expected '${expectedValue}', got '${actualValue}'`);
      }
    });

    if (conflicts.length > 0) {
      this.logger.warn(
        `Visual cursor style conflicts detected: ${conflicts.join(', ')}`,
        'VisualCursor'
      );
    }
  }

  /**
   * Smooth easing function for animations
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
