import {
  CursorPosition,
  VisualAnimationConfig,
  VisualCursorState,
} from './VisualTypes';
import { LoggingService } from '@/services/LoggingService';
import { AudioService } from '@/services/AudioService';
import { CursorDOMManager } from './CursorDOMManager';
import { CursorAnimationManager } from './CursorAnimationManager';
import { VisualCursorConfig } from './VisualCursorConfig';
import { CursorInitializationError } from './VisualCursorErrors';

/**
 * Visual cursor service for showing automation actions to users
 */
export class VisualCursorService {
  private static instance: VisualCursorService;
  private readonly logger: LoggingService;
  private readonly audioService: AudioService;
  private readonly domManager: CursorDOMManager;
  private readonly animationManager: CursorAnimationManager;
  private state: VisualCursorState;
  private config: VisualAnimationConfig;
  private isInitialized = false;

  private constructor(logger: LoggingService = LoggingService.getInstance()) {
    this.logger = logger;
    this.audioService = AudioService.getInstance(logger);
    this.domManager = new CursorDOMManager(logger);
    this.animationManager = new CursorAnimationManager(
      this.domManager,
      this.audioService,
      logger
    );

    this.state = {
      isVisible: false,
      position: { x: 0, y: 0 },
      isAnimating: false,
      isHovering: false,
      isClicking: false,
    };

    this.config = { ...VisualCursorConfig.DEFAULT_ANIMATION_CONFIG };
  }

  static getInstance(logger?: LoggingService): VisualCursorService {
    if (!VisualCursorService.instance) {
      VisualCursorService.instance = new VisualCursorService(logger);
    }
    return VisualCursorService.instance;
  }

  /**
   * Create a new instance for testing purposes
   */
  static createInstance(logger: LoggingService): VisualCursorService {
    return new VisualCursorService(logger);
  }

  /**
   * Initialize the visual cursor service
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    try {
      this.domManager.createCursorElement();
      await this.audioService.initialize();
      this.isInitialized = true;
      this.logger.info(
        'Visual cursor service initialized',
        'VisualCursorService'
      );
    } catch (error) {
      throw new CursorInitializationError(
        'Failed to initialize visual cursor service',
        {
          error,
        }
      );
    }
  }

  /**
   * Clean up the visual cursor service
   */
  destroy(): void {
    this.animationManager.destroy();
    this.domManager.destroyCursorElement();
    this.audioService.destroy();
    this.isInitialized = false;
    this.logger.info('Visual cursor service destroyed', 'VisualCursorService');
  }

  /**
   * Show the cursor at a specific position
   */
  show(position?: CursorPosition): void {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    if (position) {
      this.state.position = position;
      this.domManager.updatePosition(position);
    }

    this.domManager.show();
    this.state.isVisible = true;

    this.logger.debug(
      `Cursor shown at position (${this.state.position.x}, ${this.state.position.y})`,
      'VisualCursorService'
    );
  }

  /**
   * Hide the cursor
   */
  hide(): void {
    if (!this.isInitialized) {
      return;
    }

    this.domManager.hide();
    this.state.isVisible = false;
    this.logger.debug('Cursor hidden', 'VisualCursorService');
  }

  /**
   * Animate cursor movement to target element
   */
  async moveToElement(element: Element): Promise<void> {
    if (!this.config.enabled || !this.isInitialized || !element) {
      return;
    }

    this.state.isAnimating = true;
    try {
      this.state.position = await this.animationManager.animateToElement(
        this.state.position,
        element,
        this.config
      );
    } finally {
      this.state.isAnimating = false;
    }
  }

  /**
   * Animate cursor movement to target position
   */
  async moveToPosition(targetPosition: CursorPosition): Promise<void> {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    this.state.isAnimating = true;
    try {
      this.state.position = await this.animationManager.animateToPosition(
        this.state.position,
        targetPosition,
        this.config
      );
    } finally {
      this.state.isAnimating = false;
    }
  }

  /**
   * Perform visual click animation with hover effect
   */
  async performClick(): Promise<void> {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    this.state.isHovering = true;
    this.state.isClicking = true;

    try {
      await this.animationManager.performClickSequence(this.config);
    } finally {
      this.state.isHovering = false;
      this.state.isClicking = false;
    }
  }

  /**
   * Update animation configuration
   */
  updateConfig(config: Partial<VisualAnimationConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.debug('Visual cursor config updated', 'VisualCursorService', {
      config: this.config,
    });
  }

  /**
   * Get current cursor state
   */
  getState(): VisualCursorState {
    return {
      ...this.state,
      isAnimating: this.animationManager.getIsAnimating(),
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): VisualAnimationConfig {
    return { ...this.config };
  }

  /**
   * Check if service is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}
