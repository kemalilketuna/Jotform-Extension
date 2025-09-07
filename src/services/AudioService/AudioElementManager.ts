import { LoggingService } from '@/services/LoggingService';
import { AudioPaths, AudioConfig } from './AudioConfig';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

/**
 * Manages audio element creation, configuration, and lifecycle
 */
export class AudioElementManager {
  private readonly logger: LoggingService;
  private readonly audioPool: Map<string, HTMLAudioElement[]> = new Map();
  private readonly maxPoolSize = 5;

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Get or create audio element from pool for better performance
   */
  getPooledAudioElement(audioPath: string): HTMLAudioElement {
    const pool = this.audioPool.get(audioPath) || [];

    // Try to get an available audio element from pool
    const availableAudio = pool.find(
      (audio) =>
        audio.paused && audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA
    );

    if (availableAudio) {
      // Safely reset the audio element for reuse
      this.safeResetAudio(availableAudio);
      return availableAudio;
    }

    // Create new audio element if pool is empty or all are busy
    const audio = this.createAudioElement(audioPath);

    // Add to pool if under max size
    if (pool.length < this.maxPoolSize) {
      pool.push(audio);
      this.audioPool.set(audioPath, pool);
    }

    return audio;
  }

  /**
   * Create a new audio element with proper configuration
   */
  createAudioElement(audioPath: string): HTMLAudioElement {
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
      this.logger.error('Audio element error', 'AudioElementManager', {
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

  /**
   * Ensure audio element is ready for playback to prevent corruption
   * Optimized to reduce promise overhead
   */
  ensureAudioReady(
    audio: HTMLAudioElement,
    audioCache: ReadonlyMap<string, HTMLAudioElement>
  ): Promise<void> | void {
    // If audio is already ready, return immediately (no Promise overhead)
    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return;
    }

    // For cached audio elements, skip the ready check to improve performance
    if (audioCache.has(audio.src)) {
      return;
    }

    // Check if this is a pooled audio element that's already been used
    const pool = this.audioPool.get(this.getAudioPath(audio.src));
    if (
      pool &&
      pool.includes(audio) &&
      audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return;
    }

    // Only create Promise when absolutely necessary
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve(); // Don't reject, just proceed to prevent blocking
      }, 300); // Further reduced timeout to 300ms

      const cleanup = () => {
        clearTimeout(timeout);
        audio.removeEventListener('canplaythrough', handleReady);
        audio.removeEventListener('error', handleError);
      };

      const handleReady = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        resolve(); // Don't reject, just proceed to prevent blocking
      };

      audio.addEventListener('canplaythrough', handleReady, { once: true });
      audio.addEventListener('error', handleError, { once: true });
    });
  }

  /**
   * Extract audio path from full URL for pool lookup
   */
  private getAudioPath(src: string): string {
    // Extract the path part from chrome-extension:// URLs
    const match = src.match(/[^/]*\/([^?]+)/);
    return match ? match[1] : src;
  }

  /**
   * Apply volume variation for realistic keystroke sounds
   */
  applyVolumeVariation(
    audio: HTMLAudioElement,
    overlapping: boolean = false
  ): void {
    const volumeRange =
      AudioConfig.KEYSTROKE_VOLUME_MAX - AudioConfig.KEYSTROKE_VOLUME_MIN;
    const baseVolume =
      AudioConfig.KEYSTROKE_VOLUME_MIN + Math.random() * volumeRange;

    // Reduce volume by 30% for overlapping sounds to minimize noise
    audio.volume = overlapping ? baseVolume * 0.7 : baseVolume;
  }

  /**
   * Reset audio element to beginning if needed
   */
  resetAudioIfNeeded(audio: HTMLAudioElement): void {
    this.safeResetAudio(audio);
  }

  /**
   * Safely reset audio currentTime to prevent corruption
   */
  private safeResetAudio(audio: HTMLAudioElement): void {
    const config: ErrorHandlingConfig = {
      context: 'AudioElementManager',
      operation: 'safeResetAudio',
      logLevel: 'debug',
      sanitizeData: true,
    };

    ErrorHandlingUtils.safeExecute(
      async () => {
        // Check if audio is in a valid state for manipulation
        if (audio.readyState < HTMLMediaElement.HAVE_METADATA) {
          return;
        }

        // Only reset if audio is not at the beginning and not currently seeking
        if (audio.currentTime > 0.1 && !audio.seeking) {
          // Use a flag to prevent concurrent resets
          if (!audio.dataset.resetting) {
            audio.dataset.resetting = 'true';
            audio.currentTime = 0;

            // Clear the flag after a short delay
            setTimeout(() => {
              delete audio.dataset.resetting;
            }, 50);
          }
        }
      },
      undefined,
      config,
      this.logger
    );
  }

  /**
   * Cleanup audio element resources
   */
  cleanupAudioElement(audio: HTMLAudioElement): void {
    const config: ErrorHandlingConfig = {
      context: 'AudioElementManager',
      operation: 'cleanupAudioElement',
      logLevel: 'debug',
      sanitizeData: true,
    };

    ErrorHandlingUtils.safeExecute(
      async () => {
        audio.pause();
        audio.currentTime = 0;
        // Don't set src to empty or call load() as it triggers error events
      },
      undefined,
      config,
      this.logger
    );
  }

  /**
   * Clear all audio pools and cleanup resources
   */
  clearAudioPools(): void {
    this.audioPool.forEach((pool) => {
      pool.forEach((audio) => {
        this.cleanupAudioElement(audio);
      });
    });
    this.audioPool.clear();
    this.logger.debug('Audio pools cleared', 'AudioElementManager');
  }
}
