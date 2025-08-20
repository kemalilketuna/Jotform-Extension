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
    this.logger.debug('Visual cursor initialized', 'VisualCursor');
  }

  /**
   * Clean up the visual cursor
   */
  destroy(): void {
    if (this.cursorElement) {
      this.cursorElement.remove();
      this.cursorElement = null;
    }
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
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

    // Position absolutely and add to body
    this.cursorElement.style.position = 'fixed';
    this.cursorElement.style.top = '0';
    this.cursorElement.style.left = '0';
    this.cursorElement.style.pointerEvents = 'none';
    this.cursorElement.style.zIndex = '999999';
    this.cursorElement.style.display = 'none';
    this.cursorElement.style.transition = 'opacity 0.2s ease';

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
            #jotform-automation-cursor {
                width: 20px;
                height: 20px;
                transform: translate(-10px, -10px);
            }

            .cursor-pointer {
                width: 20px;
                height: 20px;
                background: linear-gradient(45deg, #4A90E2, #357ABD);
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
                position: relative;
            }

            .cursor-pointer::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.8;
            }

            .cursor-hover .cursor-pointer {
                transform: scale(1.2);
                background: linear-gradient(45deg, #5BA0F2, #4A90E2);
                box-shadow: 0 3px 12px rgba(74, 144, 226, 0.4);
            }

            .cursor-clicking .cursor-pointer {
                transform: scale(0.8);
                background: linear-gradient(45deg, #357ABD, #2E6BA8);
            }

            .cursor-click-ripple {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 40px;
                height: 40px;
                background: radial-gradient(circle, rgba(74, 144, 226, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
                transition: all 0.3s ease;
            }

            .cursor-clicking .cursor-click-ripple {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
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
   * Smooth easing function for animations
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
