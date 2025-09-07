import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { SingletonManager } from '@/utils/SingletonService';
import { AudioError } from './AudioErrors';
import { AudioElementManager } from './AudioElementManager';
import { AudioCacheManager } from './AudioCacheManager';
import { AudioStateManager } from './AudioStateManager';
import { AudioPlaybackEngine } from './AudioPlaybackEngine';
import {
  EventBus,
  EventTypes,
  AudioPlayEvent,
  AutomationErrorEvent,
} from '@/events';
import { ExtensionUtils } from '@/utils/ExtensionUtils';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Service for managing audio playback in the browser extension
 */
export class AudioService {
  private readonly logger: LoggingService;
  private readonly eventBus: EventBus;
  private readonly elementManager: AudioElementManager;
  private readonly cacheManager: AudioCacheManager;
  private readonly stateManager: AudioStateManager;
  private readonly playbackEngine: AudioPlaybackEngine;

  private constructor(logger?: LoggingService) {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = logger || serviceFactory.createLoggingService();
    this.eventBus = serviceFactory.createEventBus();
    this.elementManager = new AudioElementManager(this.logger);
    this.cacheManager = new AudioCacheManager(this.logger, this.elementManager);
    this.stateManager = new AudioStateManager(this.logger);
    this.playbackEngine = new AudioPlaybackEngine(
      this.logger,
      this.elementManager,
      this.cacheManager,
      this.stateManager
    );
  }

  static getInstance(logger?: LoggingService): AudioService {
    return SingletonManager.getInstance(
      'AudioService',
      () => new AudioService(logger)
    );
  }

  /**
   * Create a new instance for testing purposes
   */
  static createInstance(logger: LoggingService): AudioService {
    return new AudioService(logger);
  }

  /**
   * Initialize the audio service and preload sounds
   */
  async initialize(): Promise<void> {
    // Skip if already initialized
    if (this.stateManager.isServiceInitialized()) {
      this.logger.debug(
        'AudioService already initialized, skipping',
        'AudioService'
      );
      return;
    }

    // Skip initialization if not in extension context
    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.info(
        'AudioService skipping initialization - not in extension context',
        'AudioService'
      );
      return;
    }

    const config: ErrorHandlingConfig = {
      context: 'AudioService',
      operation: 'initialize',
      retryAttempts: 2,
      logLevel: 'error',
      sanitizeData: true,
    };

    const result = await ErrorHandlingUtils.executeWithRetry(
      async () => {
        await this.cacheManager.preloadAllSounds();
        this.stateManager.setInitialized(true);
        this.logger.debug(
          'AudioService initialized successfully',
          'AudioService'
        );
      },
      config,
      this.logger
    );

    if (!result.success) {
      // Emit error event
      this.emitErrorEvent(result.error as Error, { operation: 'initialize' });

      throw new AudioError(
        'AudioService initialization failed',
        result.error as Error
      );
    }
  }

  /**
   * Play the click sound for visual cursor
   */
  async playClickSound(): Promise<void> {
    await this.playbackEngine.playClickSound();
    this.emitAudioEvent('click');
  }

  /**
   * Play the keystroke sound for typing simulation
   */
  async playKeystrokeSound(): Promise<void> {
    await this.playbackEngine.playKeystrokeSound();
    this.emitAudioEvent('keystroke');
  }

  /**
   * Play keystroke sound with slight volume variation for more realistic typing
   */
  async playVariedKeystrokeSound(): Promise<void> {
    await this.playbackEngine.playVariedKeystrokeSound();
    this.emitAudioEvent('keystroke', { variant: 'varied' });
  }

  /**
   * Play enhanced keystroke sound with optional rapid fire effect
   */
  async playEnhancedKeystrokeSound(rapidFire: boolean = false): Promise<void> {
    await this.playbackEngine.playEnhancedKeystrokeSound(rapidFire);
    this.emitAudioEvent('keystroke', {
      variant: rapidFire ? 'rapid' : 'enhanced',
    });
  }

  /**
   * Play multiple simultaneous keystroke sounds for maximum typing effect
   */
  async playMultipleKeystrokeSounds(count: number = 2): Promise<void> {
    await this.playbackEngine.playMultipleKeystrokeSounds(count);
    this.emitAudioEvent('keystroke', { variant: 'multiple', count });
  }

  /**
   * Emit audio play event through the event bus
   */
  private emitAudioEvent(
    soundType: 'keystroke' | 'click' | 'error' | 'success',
    metadata?: Record<string, unknown>
  ): void {
    const config: ErrorHandlingConfig = {
      context: 'AudioService',
      operation: 'emitAudioEvent',
      logLevel: 'warn',
      sanitizeData: true,
    };

    ErrorHandlingUtils.safeExecute(
      async () => {
        const audioEvent: AudioPlayEvent = {
          type: EventTypes.AUDIO_PLAY,
          timestamp: Date.now(),
          source: 'AudioService',
          soundType,
          enabled: this.stateManager.isAudioEnabled(),
          metadata,
        };

        this.eventBus.emit(audioEvent);
        this.logger.debug(`Audio event emitted: ${soundType}`, 'AudioService');
      },
      undefined,
      config,
      this.logger
    );
  }

  /**
   * Emit error event through the event bus
   */
  private emitErrorEvent(
    error: Error,
    context?: Record<string, unknown>
  ): void {
    const config: ErrorHandlingConfig = {
      context: 'AudioService',
      operation: 'emitErrorEvent',
      logLevel: 'warn',
      sanitizeData: true,
    };

    ErrorHandlingUtils.safeExecute(
      async () => {
        const errorEvent: AutomationErrorEvent = {
          type: EventTypes.AUTOMATION_ERROR,
          timestamp: Date.now(),
          source: 'AudioService',
          sessionId: `audio_error_${Date.now()}`,
          error,
          context,
        };

        this.eventBus.emit(errorEvent);
        this.logger.debug(
          `Error event emitted: ${error.message}`,
          'AudioService'
        );
      },
      undefined,
      config,
      this.logger
    );
  }

  /**
   * Enable or disable audio playback
   */
  setEnabled(enabled: boolean): void {
    this.stateManager.setEnabled(enabled);
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    return this.stateManager.isAudioEnabled();
  }

  /**
   * Cleanup audio resources
   */
  destroy(): void {
    this.cacheManager.clearCache();
    this.elementManager.clearAudioPools();
    this.stateManager.reset();
    this.logger.debug('AudioService destroyed', 'AudioService');
  }
}
