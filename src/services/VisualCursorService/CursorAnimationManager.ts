import { CursorPosition, VisualAnimationConfig } from './VisualTypes';
import { LoggingService } from '@/services/LoggingService';
import { AudioService } from '@/services/AudioService';
import { CursorDOMManager } from './CursorDOMManager';
import { VisualCursorConfig } from './VisualCursorConfig';
import { CursorAnimationError } from './VisualCursorErrors';

/**
 * Manages animations and interactions for the visual cursor
 */
export class CursorAnimationManager {
  private animationTimeout: number | null = null;
  private isAnimating = false;

  constructor(
    private readonly domManager: CursorDOMManager,
    private readonly audioService: AudioService,
    private readonly logger: LoggingService
  ) {}

  /**
   * Animate cursor movement to target position
   */
  async animateToPosition(
    currentPosition: CursorPosition,
    targetPosition: CursorPosition,
    config: VisualAnimationConfig
  ): Promise<CursorPosition> {
    if (this.isAnimating) {
      throw new CursorAnimationError('Animation already in progress');
    }

    this.isAnimating = true;
    const startPosition = { ...currentPosition };
    const distance = this.calculateDistance(startPosition, targetPosition);
    const duration = Math.max(
      VisualCursorConfig.TIMING_CONSTANTS.minAnimationDuration,
      distance * config.animationSpeed
    );
    const startTime = Date.now();

    return new Promise<CursorPosition>((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = this.easeInOutCubic(progress);

        const currentPos: CursorPosition = {
          x:
            startPosition.x +
            (targetPosition.x - startPosition.x) * easeProgress,
          y:
            startPosition.y +
            (targetPosition.y - startPosition.y) * easeProgress,
        };

        this.domManager.updatePosition(currentPos);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isAnimating = false;
          this.logger.debug(
            'Cursor animation completed',
            'CursorAnimationManager'
          );
          resolve(currentPos);
        }
      };

      animate();
    });
  }

  /**
   * Animate cursor movement to target element
   */
  async animateToElement(
    currentPosition: CursorPosition,
    element: Element,
    config: VisualAnimationConfig
  ): Promise<CursorPosition> {
    const rect = element.getBoundingClientRect();
    const targetPosition: CursorPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    return this.animateToPosition(currentPosition, targetPosition, config);
  }

  /**
   * Perform complete click animation sequence
   */
  async performClickSequence(config: VisualAnimationConfig): Promise<void> {
    this.logger.debug(
      'Starting click animation sequence',
      'CursorAnimationManager'
    );

    // Start hover animation
    await this.startHover(config.hoverDuration);

    // Perform click animation
    await this.startClick(config.clickDuration);

    // End hover state
    this.endHover();
  }

  /**
   * Start hover animation
   */
  private async startHover(duration: number): Promise<void> {
    const { hover } = VisualCursorConfig.CSS_CLASSES;
    this.domManager.addClass(hover);

    return new Promise<void>((resolve) => {
      this.animationTimeout = window.setTimeout(() => {
        this.logger.debug(
          'Hover animation completed',
          'CursorAnimationManager'
        );
        resolve();
      }, duration);
    });
  }

  /**
   * Start click animation
   */
  private async startClick(duration: number): Promise<void> {
    const { clicking } = VisualCursorConfig.CSS_CLASSES;
    this.domManager.addClass(clicking);

    // Play click sound
    this.audioService.playClickSound().catch((error) => {
      this.logger.debug(
        'Click sound playback failed',
        'CursorAnimationManager',
        { error }
      );
    });

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.domManager.removeClass(clicking);
        this.logger.debug(
          'Click animation completed',
          'CursorAnimationManager'
        );
        resolve();
      }, duration);
    });
  }

  /**
   * End hover state
   */
  private endHover(): void {
    const { hover } = VisualCursorConfig.CSS_CLASSES;
    this.domManager.removeClass(hover);
  }

  /**
   * Calculate distance between two positions
   */
  private calculateDistance(
    pos1: CursorPosition,
    pos2: CursorPosition
  ): number {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    );
  }

  /**
   * Smooth easing function for animations
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Clean up any running animations
   */
  destroy(): void {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    this.isAnimating = false;
    this.logger.debug('Animation manager destroyed', 'CursorAnimationManager');
  }

  /**
   * Check if animation is currently running
   */
  getIsAnimating(): boolean {
    return this.isAnimating;
  }
}
