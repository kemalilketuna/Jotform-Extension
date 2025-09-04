import { LoggingService } from '@/services/LoggingService';
import { AudioPaths } from './AudioConfig';
import { AudioElementManager } from './AudioElementManager';
import { AudioCacheManager } from './AudioCacheManager';
import { AudioStateManager } from './AudioStateManager';

/**
 * Handles all audio playback logic including keystroke variations and overlapping sounds
 */
export class AudioPlaybackEngine {
  private readonly logger: LoggingService;
  private readonly elementManager: AudioElementManager;
  private readonly cacheManager: AudioCacheManager;
  private readonly stateManager: AudioStateManager;

  constructor(
    logger: LoggingService,
    elementManager: AudioElementManager,
    cacheManager: AudioCacheManager,
    stateManager: AudioStateManager
  ) {
    this.logger = logger;
    this.elementManager = elementManager;
    this.cacheManager = cacheManager;
    this.stateManager = stateManager;
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
    if (!this.stateManager.isAudioEnabled()) {
      this.logger.debug(
        'Audio playback disabled, skipping varied keystroke sound',
        'AudioPlaybackEngine'
      );
      return;
    }

    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.debug(
        'Audio playback skipped - not in extension context',
        'AudioPlaybackEngine'
      );
      return;
    }

    // Apply debouncing to prevent excessive audio calls
    if (this.stateManager.shouldDebounceKeystroke()) {
      return;
    }

    try {
      // Get pooled audio instance for overlapping playback to reduce GC pressure
      const audio = this.elementManager.getPooledAudioElement(
        AudioPaths.KEYSTROKE_SOUND
      );
      const readyPromise = this.elementManager.ensureAudioReady(
        audio,
        this.cacheManager.getCache()
      );
      if (readyPromise) {
        await readyPromise;
      }

      // Add volume variation using config constants for more realistic typing
      this.elementManager.applyVolumeVariation(audio);

      // Track and cleanup audio element
      this.stateManager.trackAudioElement(audio);
      await audio.play();

      // Add slight echo effect by playing a second overlapping sound
      setTimeout(() => {
        this.playOverlappingKeystrokeSound(0).catch(() => {
          // Ignore audio errors
        });
      }, 50);
    } catch (error) {
      this.logger.warn(
        'Failed to play varied keystroke sound',
        'AudioPlaybackEngine',
        {
          error,
        }
      );
    }
  }

  /**
   * Play enhanced keystroke sound with optional rapid fire effect
   */
  async playEnhancedKeystrokeSound(rapidFire: boolean = false): Promise<void> {
    if (!this.stateManager.isAudioEnabled()) {
      this.logger.debug(
        'Audio playback disabled, skipping enhanced keystroke sound',
        'AudioPlaybackEngine'
      );
      return;
    }

    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.debug(
        'Audio playback skipped - not in extension context',
        'AudioPlaybackEngine'
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
        'AudioPlaybackEngine',
        {
          error,
        }
      );
    }
  }

  /**
   * Play multiple simultaneous keystroke sounds for maximum typing effect
   */
  async playMultipleKeystrokeSounds(count: number = 2): Promise<void> {
    if (
      !this.stateManager.isAudioEnabled() ||
      !ExtensionUtils.isExtensionContext()
    ) {
      return;
    }

    // Apply threshold to prevent audio noise from too many overlapping sounds
    if (!this.stateManager.canPlayConcurrentSound()) {
      return;
    }

    try {
      const actualCount = Math.min(
        count,
        this.stateManager.getMaxConcurrentSounds() -
          this.stateManager.getActiveSoundCount()
      );
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
      this.logger.warn(
        'Failed to play multiple keystroke sounds',
        'AudioPlaybackEngine',
        {
          error,
        }
      );
    }
  }

  /**
   * Play keystroke sound with delay for overlapping effects
   */
  private async playOverlappingKeystrokeSound(
    delayMs: number = 0
  ): Promise<void> {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (
      !this.stateManager.isAudioEnabled() ||
      !ExtensionUtils.isExtensionContext()
    ) {
      return;
    }

    try {
      // Get pooled audio instance for overlapping playback
      const audio = this.elementManager.getPooledAudioElement(
        AudioPaths.KEYSTROKE_SOUND
      );
      const readyPromise = this.elementManager.ensureAudioReady(
        audio,
        this.cacheManager.getCache()
      );
      if (readyPromise) {
        await readyPromise;
      }

      // Apply reduced volume variation to minimize noise when overlapping
      this.elementManager.applyVolumeVariation(audio, true);

      // Track and cleanup audio element
      this.stateManager.trackAudioElement(audio);
      await audio.play();
    } catch (error) {
      this.stateManager.decrementActiveSoundCount();
      this.logger.warn(
        'Failed to play overlapping keystroke sound',
        'AudioPlaybackEngine',
        {
          error,
        }
      );
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
    if (!this.stateManager.isAudioEnabled()) {
      this.logger.debug(disabledMessage, 'AudioPlaybackEngine');
      return;
    }

    // Skip if not in extension context
    if (!ExtensionUtils.isExtensionContext()) {
      this.logger.debug(
        'Audio playback skipped - not in extension context',
        'AudioPlaybackEngine'
      );
      return;
    }

    try {
      const audio = this.cacheManager.getOrCreateAudio(audioPath);

      // Wait for audio to be ready before playing to prevent corruption
      const readyPromise = this.elementManager.ensureAudioReady(
        audio,
        this.cacheManager.getCache()
      );
      if (readyPromise) {
        await readyPromise;
      }

      // Only reset if audio is not at the beginning to prevent corruption
      this.elementManager.resetAudioIfNeeded(audio);

      await audio.play();
    } catch (error) {
      this.logger.warn(`Failed to play ${soundType}`, 'AudioPlaybackEngine', {
        error,
      });
      // Don't throw error for audio playback failures to avoid breaking automation
    }
  }
}
