import { LoggingService } from '@/services/LoggingService';
import { AudioPaths, AudioConfig } from './AudioConfig';
import { AudioError } from './AudioErrors';

/**
 * Manages audio element creation, configuration, and lifecycle
 */
export class AudioElementManager {
  private readonly logger: LoggingService;

  constructor(logger: LoggingService) {
    this.logger = logger;
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
  async ensureAudioReady(audio: HTMLAudioElement, audioCache: ReadonlyMap<string, HTMLAudioElement>): Promise<void> {
    // If audio is already ready, return immediately
    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return;
    }

    // For cached audio elements, skip the ready check to improve performance
    if (audioCache.has(audio.src)) {
      return;
    }

    // Wait for audio to be ready with reduced timeout
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve(); // Don't reject, just proceed to prevent blocking
      }, 500); // Reduced timeout from 1000ms to 500ms

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
   * Apply volume variation for realistic keystroke sounds
   */
  applyVolumeVariation(audio: HTMLAudioElement, overlapping: boolean = false): void {
    const volumeRange = AudioConfig.KEYSTROKE_VOLUME_MAX - AudioConfig.KEYSTROKE_VOLUME_MIN;
    const baseVolume = AudioConfig.KEYSTROKE_VOLUME_MIN + Math.random() * volumeRange;
    
    // Reduce volume by 30% for overlapping sounds to minimize noise
    audio.volume = overlapping ? baseVolume * 0.7 : baseVolume;
  }

  /**
   * Reset audio element to beginning if needed
   */
  resetAudioIfNeeded(audio: HTMLAudioElement): void {
    // Only reset if audio is not at the beginning to prevent corruption
    if (audio.currentTime > 0.1) {
      audio.currentTime = 0;
    }
  }

  /**
   * Cleanup audio element resources
   */
  cleanupAudioElement(audio: HTMLAudioElement): void {
    try {
      audio.pause();
      audio.currentTime = 0;
      // Don't set src to empty or call load() as it triggers error events
    } catch {
      // Ignore cleanup errors to prevent console spam
    }
  }
}