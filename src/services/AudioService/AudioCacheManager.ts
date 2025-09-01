import { LoggingService } from '@/services/LoggingService';
import { AudioPaths } from './AudioConfig';
import { AudioError } from './AudioErrors';
import { AudioElementManager } from './AudioElementManager';

/**
 * Manages audio caching, preloading, and resource cleanup
 */
export class AudioCacheManager {
  private readonly logger: LoggingService;
  private readonly elementManager: AudioElementManager;
  private readonly audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor(logger: LoggingService, elementManager: AudioElementManager) {
    this.logger = logger;
    this.elementManager = elementManager;
  }

  /**
   * Get or create audio element for the given path
   */
  getOrCreateAudio(audioPath: string): HTMLAudioElement {
    let audio = this.audioCache.get(audioPath);

    if (!audio) {
      audio = this.elementManager.createAudioElement(audioPath);
      this.audioCache.set(audioPath, audio);
    }

    return audio;
  }

  /**
   * Preload all audio files
   */
  async preloadAllSounds(): Promise<void> {
    await Promise.all([
      this.preloadSound(AudioPaths.CLICK_SOUND, 'click sound'),
      this.preloadSound(AudioPaths.KEYSTROKE_SOUND, 'keystroke sound'),
    ]);
  }

  /**
   * Preload a specific sound
   */
  async preloadSound(audioPath: string, soundType: string): Promise<void> {
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
   * Check if audio is cached
   */
  isCached(audioPath: string): boolean {
    return this.audioCache.has(audioPath);
  }

  /**
   * Get the audio cache for read-only operations
   */
  getCache(): ReadonlyMap<string, HTMLAudioElement> {
    return this.audioCache;
  }

  /**
   * Clear all cached audio and cleanup resources
   */
  clearCache(): void {
    this.audioCache.forEach((audio) => {
      this.elementManager.cleanupAudioElement(audio);
    });
    this.audioCache.clear();
    this.logger.debug('Audio cache cleared', 'AudioCacheManager');
  }

  /**
   * Remove specific audio from cache
   */
  removeFromCache(audioPath: string): void {
    const audio = this.audioCache.get(audioPath);
    if (audio) {
      this.elementManager.cleanupAudioElement(audio);
      this.audioCache.delete(audioPath);
      this.logger.debug(`Removed ${audioPath} from cache`, 'AudioCacheManager');
    }
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.audioCache.size;
  }
}
