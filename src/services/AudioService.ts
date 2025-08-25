import { LoggingService } from './LoggingService';

/**
 * Audio file paths managed through OOP pattern
 */
class AudioPaths {
  static readonly CLICK_SOUND = 'sounds/radio_select.mp3' as const;
}

/**
 * Audio configuration constants
 */
class AudioConfig {
  static readonly DEFAULT_VOLUME = 1 as const;
  static readonly PRELOAD_POLICY = 'auto' as const;
}

/**
 * Custom error class for audio-related errors
 */
export class AudioError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AudioError';
  }
}

/**
 * Service for managing audio playback in the browser extension
 */
export class AudioService {
  private static instance: AudioService;
  private readonly logger: LoggingService;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private isEnabled: boolean = true;

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
    try {
      await this.preloadClickSound();
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
    if (!this.isEnabled) {
      this.logger.debug(
        'Audio playback disabled, skipping click sound',
        'AudioService'
      );
      return;
    }

    try {
      const audio = this.getOrCreateAudio(AudioPaths.CLICK_SOUND);

      // Reset audio to beginning if it's already playing
      audio.currentTime = 0;

      await audio.play();
      this.logger.debug('Click sound played successfully', 'AudioService');
    } catch (error) {
      this.logger.warn('Failed to play click sound', 'AudioService', { error });
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
      audio.pause();
      audio.src = '';
      audio.load();
    });
    this.audioCache.clear();
    this.logger.debug('AudioService destroyed', 'AudioService');
  }

  /**
   * Preload the click sound for better performance
   */
  private async preloadClickSound(): Promise<void> {
    try {
      const audio = this.getOrCreateAudio(AudioPaths.CLICK_SOUND);

      return new Promise<void>((resolve, reject) => {
        const handleLoad = () => {
          audio.removeEventListener('canplaythrough', handleLoad);
          audio.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = (_event: Event) => {
          audio.removeEventListener('canplaythrough', handleLoad);
          audio.removeEventListener('error', handleError);
          reject(new AudioError('Failed to preload click sound'));
        };

        audio.addEventListener('canplaythrough', handleLoad);
        audio.addEventListener('error', handleError);

        // If already loaded, resolve immediately
        if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          handleLoad();
        }
      });
    } catch (error) {
      throw new AudioError('Failed to preload click sound', error as Error);
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
   * Create a new audio element with proper configuration
   */
  private createAudioElement(audioPath: string): HTMLAudioElement {
    const audio = new Audio();

    // Use chrome.runtime.getURL for extension resources
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      audio.src = chrome.runtime.getURL(audioPath);
    } else {
      // Fallback for testing environments
      audio.src = audioPath;
    }

    audio.volume = AudioConfig.DEFAULT_VOLUME;
    audio.preload = AudioConfig.PRELOAD_POLICY;

    // Add error handling
    audio.addEventListener('error', (event) => {
      this.logger.error('Audio element error', 'AudioService', {
        audioPath,
        error: event,
      });
    });

    return audio;
  }
}
