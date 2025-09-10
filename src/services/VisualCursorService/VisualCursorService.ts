import {
  CursorPosition,
  VisualAnimationConfig,
  VisualCursorState,
} from './VisualTypes';
import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { AudioService } from '@/services/AudioService';
import { CursorDOMManager } from './CursorDOMManager';
import { CursorAnimationManager } from './CursorAnimationManager';
import { VisualCursorConfig } from './VisualCursorConfig';
import { CursorInitializationError } from './VisualCursorErrors';
import {
  EventBus,
  EventTypes,
  AutomationStartedEvent,
  AutomationStoppedEvent,
  ElementDetectedEvent,
} from '@/events';
import { SingletonManager } from '@/utils/SingletonService';

/**
 * Visual cursor service for showing automation actions to users
 */
export class VisualCursorService {
  private readonly logger: LoggingService;
  private readonly eventBus: EventBus;
  private readonly audioService: AudioService;
  private readonly domManager: CursorDOMManager;
  private readonly animationManager: CursorAnimationManager;
  private state: VisualCursorState;
  private config: VisualAnimationConfig;
  private isInitialized = false;

  private constructor(logger?: LoggingService) {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = logger || serviceFactory.createLoggingService();
    this.eventBus = serviceFactory.createEventBus();
    this.audioService = serviceFactory.createAudioService();
    this.domManager = new CursorDOMManager(this.logger);
    this.animationManager = new CursorAnimationManager(
      this.domManager,
      this.audioService,
      this.logger
    );

    this.state = {
      isVisible: false,
      position: { x: 0, y: 0 },
      isAnimating: false,
      isHovering: false,
      isClicking: false,
    };

    this.config = { ...VisualCursorConfig.DEFAULT_ANIMATION_CONFIG };

    this.setupEventSubscriptions();
  }

  /**
   * Setup event subscriptions to listen for automation events
   */
  private setupEventSubscriptions(): void {
    // Listen for automation start to show cursor
    this.eventBus.on<AutomationStartedEvent>(
      EventTypes.AUTOMATION_STARTED,
      (event) => {
        this.logger.info(
          `Automation started for session ${event.sessionId}, showing cursor`,
          'VisualCursorService'
        );
        if (this.isInitialized && this.config.enabled) {
          this.show({ x: window.innerWidth / 2, y: window.innerHeight - 20 });
        }
      }
    );

    // Listen for automation stop to hide cursor and cancel animations
    this.eventBus.on<AutomationStoppedEvent>(
      EventTypes.AUTOMATION_STOPPED,
      (event) => {
        this.logger.info(
          `Automation stopped for session ${event.sessionId}, cancelling animations and hiding cursor`,
          'VisualCursorService'
        );
        this.animationManager.cancel();
        this.hide();
      }
    );

    // Listen for element detection to move cursor
    this.eventBus.on<ElementDetectedEvent>(
      EventTypes.ELEMENT_DETECTED,
      (event) => {
        this.logger.debug(
          'Element detected, moving cursor to element',
          'VisualCursorService'
        );
        if (this.state.isVisible && event.element) {
          const rect = event.element.getBoundingClientRect();
          this.moveToPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          }).catch((error) => {
            this.logger.error(
              `Failed to move cursor to element: ${error}`,
              'VisualCursorService'
            );
          });
        }
      }
    );
  }

  static getInstance(logger?: LoggingService): VisualCursorService {
    return SingletonManager.getInstance(
      'VisualCursorService',
      () => new VisualCursorService(logger)
    );
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

      // Emit cursor move event
      await this.eventBus.emit({
        type: EventTypes.CURSOR_MOVE,
        timestamp: Date.now(),
        x: this.state.position.x,
        y: this.state.position.y,
        element,
        source: 'VisualCursorService',
      });
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
  async performClick(element?: Element): Promise<void> {
    if (!this.config.enabled || !this.isInitialized) {
      return;
    }

    this.state.isHovering = true;
    this.state.isClicking = true;

    try {
      await this.animationManager.performClickSequence(this.config);

      // Emit cursor click event if element is provided
      if (element) {
        await this.eventBus.emit({
          type: EventTypes.CURSOR_CLICK,
          timestamp: Date.now(),
          x: this.state.position.x,
          y: this.state.position.y,
          element,
          source: 'VisualCursorService',
        });
      }
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
