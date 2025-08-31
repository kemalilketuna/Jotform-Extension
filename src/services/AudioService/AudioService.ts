import { LoggingService } from '@/services/LoggingService';
import { ExtensionUtils } from '@/utils/ExtensionUtils';
import { AudioError } from './AudioErrors';
import { AudioElementManager } from './AudioElementManager';
import { AudioCacheManager } from './AudioCacheManager';
import { AudioStateManager } from './AudioStateManager';
import { AudioPlaybackEngine } from './AudioPlaybackEngine';

/**
 * Service for managing audio playback in the browser extension
 */
export class AudioService {
  private static instance: AudioService;
  private readonly logger: LoggingService;
  private readonly elementManager: AudioElementManager;
  private readonly cacheManager: AudioCacheManager;
  private readonly stateManager: AudioStateManager;
  private readonly playbackEngine: AudioPlaybackEngine;

  private constructor(logger: LoggingService = LoggingService.getInstance()) {
    this.logger = logger;
    this.elementManager = new AudioElementManager(logger);
    this.cacheManager = new AudioCacheManager(logger, this.elementManager);
    this.stateManager = new AudioStateManager(logger);
    this.playbackEngine = new AudioPlaybackEngine(
      logger,
      this.elementManager,
      this.cacheManager,
      this.stateManager
    );
  }

  static getInstance(logger?: LoggingService): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService(logger);
    }
    return AudioService.instance;
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

    try {
      await this.cacheManager.preloadAllSounds();
      this.stateManager.setInitialized(true);
      this.logger.debug(
        'AudioService initialized successfully',
        'AudioService'
      );
    } catch (error) {
      this.logger.error('Failed to initialize AudioService', 'AudioService', {
        error,
      });
      throw new AudioError(
        'AudioService initialization failed',
        error as Error
      );
    }
  }

  /**
   * Play the click sound for visual cursor
   */
  async playClickSound(): Promise<void> {
    await this.playbackEngine.playClickSound();
  }

  /**
   * Play the keystroke sound for typing simulation
   */
  async playKeystrokeSound(): Promise<void> {
    await this.playbackEngine.playKeystrokeSound();
  }

  /**
   * Play keystroke sound with slight volume variation for more realistic typing
   */
  async playVariedKeystrokeSound(): Promise<void> {
    await this.playbackEngine.playVariedKeystrokeSound();
  }

  /**
   * Play enhanced keystroke sound with optional rapid fire effect
   */
  async playEnhancedKeystrokeSound(rapidFire: boolean = false): Promise<void> {
    await this.playbackEngine.playEnhancedKeystrokeSound(rapidFire);
  }

  /**
   * Play multiple simultaneous keystroke sounds for maximum typing effect
   */
  async playMultipleKeystrokeSounds(count: number = 2): Promise<void> {
    await this.playbackEngine.playMultipleKeystrokeSounds(count);
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
    this.stateManager.reset();
    this.logger.debug('AudioService destroyed', 'AudioService');
  }
}
