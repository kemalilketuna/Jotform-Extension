import { LoggingService } from '@/services/LoggingService';
import { ExtensionUtils } from '@/utils/ExtensionUtils';
import { AudioPaths, AudioConfig } from './AudioConfig';
import { AudioError } from './AudioErrors';

/**
 * Service for managing audio playback in the browser extension
 */
export class AudioService {
  private static instance: AudioService;
  private readonly logger: LoggingService;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;
  private activeSounds: number = 0;
  private readonly MAX_CONCURRENT_SOUNDS = 3;

  private constructor(logger: LoggingService = LoggingService.getInstance()) {
    this.logger = logger;
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
    if (this.isInitialized) {
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
      await Promise.all([
        this.preloadClickSound(),
        this.preloadKeystrokeSound(),
      ]);
      this.isInitialized = true;
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
    await this.playSound(
      AudioPaths.CLICK_SOUND,
      'click sound',
      'Audio playback disabled, skipping click sound'
    );
  }

  /**
   * Play the keystroke sound for typing simulation
   */
  async playKeystrokeSound(): Promise<void> {
    await this.playSound(
      AudioPaths.KEYSTROKE_SOUND,
      'keystroke sound',
      'Audio playback disabled, skipping keystroke sound'
    );
  }

  /**
   * Play keystroke sound with slight volume variation for more realistic typing
   */
  async playVariedKeystrokeSound(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug('Audio playback disabled, skipping varied keystroke sound', 'AudioService');
      return;
    }

    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.debug(
        'Audio playback skipped - not in extension context',
        'AudioService'
      );
      return;
    }

    try {
      // Create new audio instance for overlapping playback instead of reusing cached one
      const audio = this.createAudioElement(AudioPaths.KEYSTROKE_SOUND);
      await this.ensureAudioReady(audio);

      // Add volume variation using config constants for more realistic typing
      const volumeRange = AudioConfig.KEYSTROKE_VOLUME_MAX - AudioConfig.KEYSTROKE_VOLUME_MIN;
      audio.volume = AudioConfig.KEYSTROKE_VOLUME_MIN + Math.random() * volumeRange;

      await audio.play();

      // Add slight echo effect by playing a second overlapping sound
      setTimeout(() => {
        this.playOverlappingKeystrokeSound(0).catch(() => {
          // Ignore audio errors
        });
      }, 50);
    } catch (error) {
      this.logger.warn('Failed to play varied keystroke sound', 'AudioService', {
        error,
      });
    }
  }

  /**
   * Play enhanced keystroke sound with optional rapid fire effect
   */
  async playEnhancedKeystrokeSound(rapidFire: boolean = false): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug(
        'Audio playback disabled, skipping enhanced keystroke sound',
        'AudioService'
      );
      return;
    }

    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.debug(
        'Audio playback skipped - not in extension context',
        'AudioService'
      );
      return;
    }

    try {
      if (rapidFire) {
        // Play multiple overlapping sounds for rapid typing effect
        const promises = [];
        for (let i = 0; i < 3; i++) {
          promises.push(this.playOverlappingKeystrokeSound(i * 30)); // Start each sound 30ms apart
        }
        // Don't await - let them play concurrently
        Promise.all(promises).catch(() => {
          // Ignore audio errors to avoid breaking typing flow
        });
      } else {
        await this.playVariedKeystrokeSound();
      }
    } catch (error) {
      this.logger.warn(
        'Failed to play enhanced keystroke sound',
        'AudioService',
        {
          error,
        }
      );
    }
  }

  /**
   * Play keystroke sound with delay for overlapping effects
   */
  private async playOverlappingKeystrokeSound(delayMs: number = 0): Promise<void> {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    if (!this.isEnabled || !ExtensionUtils.isExtensionContext()) {
      return;
    }

    try {
      // Create a new audio instance for overlapping playback
      const audio = this.createAudioElement(AudioPaths.KEYSTROKE_SOUND);
      await this.ensureAudioReady(audio);

      // Apply reduced volume variation to minimize noise when overlapping
      const volumeRange = AudioConfig.KEYSTROKE_VOLUME_MAX - AudioConfig.KEYSTROKE_VOLUME_MIN;
      const baseVolume = AudioConfig.KEYSTROKE_VOLUME_MIN + Math.random() * volumeRange;
      audio.volume = baseVolume * 0.7; // Reduce volume by 30% for overlapping sounds

      // Track active sounds
      this.activeSounds++;

      audio.addEventListener('ended', () => {
        this.activeSounds = Math.max(0, this.activeSounds - 1);
      });

      audio.addEventListener('error', () => {
        this.activeSounds = Math.max(0, this.activeSounds - 1);
      });

      await audio.play();
    } catch (error) {
      this.activeSounds = Math.max(0, this.activeSounds - 1);
      this.logger.warn('Failed to play overlapping keystroke sound', 'AudioService', {
        error,
      });
    }
  }

  /**
   * Play multiple simultaneous keystroke sounds for maximum typing effect
   */
  async playMultipleKeystrokeSounds(count: number = 2): Promise<void> {
    if (!this.isEnabled || !ExtensionUtils.isExtensionContext()) {
      return;
    }

    // Apply threshold to prevent audio noise from too many overlapping sounds
    if (this.activeSounds >= this.MAX_CONCURRENT_SOUNDS) {
      return;
    }

    try {
      const actualCount = Math.min(count, this.MAX_CONCURRENT_SOUNDS - this.activeSounds);
      const promises: Promise<void>[] = [];

      for (let i = 0; i < actualCount; i++) {
        const promise = new Promise<void>((resolve) => {
          setTimeout(() => {
            this.playOverlappingKeystrokeSound().finally(() => resolve());
          }, i * 20); // Increased delay to 20ms to reduce overlap noise
        });
        promises.push(promise);
      }

      await Promise.all(promises);
    } catch (error) {
      this.logger.warn('Failed to play multiple keystroke sounds', 'AudioService', {
        error,
      });
    }
  }

  /**
   * Common method for playing audio with consistent error handling and validation
   */
  private async playSound(
    audioPath: string,
    soundType: string,
    disabledMessage: string
  ): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug(disabledMessage, 'AudioService');
      return;
    }

    // Skip if not in extension context
    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.debug(
        'Audio playback skipped - not in extension context',
        'AudioService'
      );
      return;
    }

    try {
      const audio = this.getOrCreateAudio(audioPath);

      // Wait for audio to be ready before playing to prevent corruption
      await this.ensureAudioReady(audio);

      // Only reset if audio is not at the beginning to prevent corruption
      if (audio.currentTime > 0.1) {
        audio.currentTime = 0;
      }

      await audio.play();
    } catch (error) {
      this.logger.warn(`Failed to play ${soundType}`, 'AudioService', {
        error,
      });
      // Don't throw error for audio playback failures to avoid breaking automation
    }
  }

  /**
   * Enable or disable audio playback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.logger.debug(
      `Audio playback ${enabled ? 'enabled' : 'disabled'}`,
      'AudioService'
    );
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Cleanup audio resources
   */
  destroy(): void {
    this.audioCache.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        // Don't set src to empty or call load() as it triggers error events
      } catch {
        // Ignore cleanup errors to prevent console spam
      }
    });
    this.audioCache.clear();
    this.logger.debug('AudioService destroyed', 'AudioService');
  }

  /**
   * Preload the click sound for better performance
   */
  private async preloadClickSound(): Promise<void> {
    return this.preloadSound(AudioPaths.CLICK_SOUND, 'click sound');
  }

  /**
   * Preload the keystroke sound for better performance
   */
  private async preloadKeystrokeSound(): Promise<void> {
    return this.preloadSound(AudioPaths.KEYSTROKE_SOUND, 'keystroke sound');
  }

  /**
   * Common method for preloading audio with consistent error handling
   */
  private async preloadSound(
    audioPath: string,
    soundType: string
  ): Promise<void> {
    try {
      const audio = this.getOrCreateAudio(audioPath);

      return new Promise<void>((resolve, reject) => {
        const handleLoad = () => {
          audio.removeEventListener('canplaythrough', handleLoad);
          audio.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = (_event: Event) => {
          audio.removeEventListener('canplaythrough', handleLoad);
          audio.removeEventListener('error', handleError);
          reject(new AudioError(`Failed to preload ${soundType}`));
        };

        audio.addEventListener('canplaythrough', handleLoad);
        audio.addEventListener('error', handleError);

        // If already loaded, resolve immediately
        if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          handleLoad();
        }
      });
    } catch (error) {
      throw new AudioError(`Failed to preload ${soundType}`, error as Error);
    }
  }

  /**
   * Get or create audio element for the given path
   */
  private getOrCreateAudio(audioPath: string): HTMLAudioElement {
    let audio = this.audioCache.get(audioPath);

    if (!audio) {
      audio = this.createAudioElement(audioPath);
      this.audioCache.set(audioPath, audio);
    }

    return audio;
  }

  /**
   * Ensure audio element is ready for playback to prevent corruption
   */
  private async ensureAudioReady(audio: HTMLAudioElement): Promise<void> {
    // If audio is already ready, return immediately
    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return;
    }

    // Wait for audio to be ready with timeout to prevent hanging
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        audio.removeEventListener('canplaythrough', handleReady);
        audio.removeEventListener('error', handleError);
        resolve(); // Don't reject, just proceed to prevent blocking
      }, 1000); // 1 second timeout

      const handleReady = () => {
        clearTimeout(timeout);
        audio.removeEventListener('canplaythrough', handleReady);
        audio.removeEventListener('error', handleError);
        resolve();
      };

      const handleError = () => {
        clearTimeout(timeout);
        audio.removeEventListener('canplaythrough', handleReady);
        audio.removeEventListener('error', handleError);
        resolve(); // Don't reject, just proceed to prevent blocking
      };

      audio.addEventListener('canplaythrough', handleReady);
      audio.addEventListener('error', handleError);
    });
  }

  /**
   * Create a new audio element with proper configuration
   */
  private createAudioElement(audioPath: string): HTMLAudioElement {
    const audio = new Audio();

    // Set preload policy first to prevent corruption
    audio.preload = AudioConfig.PRELOAD_POLICY;

    // Set volume based on audio type before setting src
    audio.volume =
      audioPath === AudioPaths.KEYSTROKE_SOUND
        ? AudioConfig.KEYSTROKE_VOLUME
        : AudioConfig.DEFAULT_VOLUME;

    // Add error handling before setting src
    audio.addEventListener('error', (event) => {
      this.logger.error('Audio element error', 'AudioService', {
        audioPath,
        error: event,
      });
    });

    // Set src last to ensure all properties are configured
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      audio.src = chrome.runtime.getURL(audioPath);
    } else {
      // Fallback for testing environments
      audio.src = audioPath;
    }

    return audio;
  }
}
