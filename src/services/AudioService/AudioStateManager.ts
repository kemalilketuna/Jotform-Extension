import { LoggingService } from '@/services/LoggingService';

/**
 * Manages audio service state, configuration, and concurrent sound tracking
 */
export class AudioStateManager {
  private readonly logger: LoggingService;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;
  private activeSounds: WeakMap<HTMLAudioElement, boolean> = new WeakMap();
  private activeSoundCount: number = 0;
  private lastKeystrokeTime: number = 0;
  
  private readonly MAX_CONCURRENT_SOUNDS = 3;
  private readonly DEBOUNCE_THRESHOLD = 10; // ms

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Enable or disable audio playback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.logger.debug(
      `Audio playback ${enabled ? 'enabled' : 'disabled'}`,
      'AudioStateManager'
    );
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Mark service as initialized
   */
  setInitialized(initialized: boolean): void {
    this.isInitialized = initialized;
    if (initialized) {
      this.logger.debug('AudioService initialized successfully', 'AudioStateManager');
    }
  }

  /**
   * Check if we can play more concurrent sounds
   */
  canPlayConcurrentSound(): boolean {
    return this.activeSoundCount < this.MAX_CONCURRENT_SOUNDS;
  }

  /**
   * Get current active sound count
   */
  getActiveSoundCount(): number {
    return this.activeSoundCount;
  }

  /**
   * Get maximum concurrent sounds allowed
   */
  getMaxConcurrentSounds(): number {
    return this.MAX_CONCURRENT_SOUNDS;
  }

  /**
   * Check if keystroke should be debounced
   */
  shouldDebounceKeystroke(): boolean {
    const now = Date.now();
    if (now - this.lastKeystrokeTime < this.DEBOUNCE_THRESHOLD) {
      return true;
    }
    this.lastKeystrokeTime = now;
    return false;
  }

  /**
   * Track audio element for proper cleanup and concurrent sound management
   */
  trackAudioElement(audio: HTMLAudioElement): void {
    this.activeSounds.set(audio, true);
    this.activeSoundCount++;

    const cleanup = () => {
      if (this.activeSounds.has(audio)) {
        this.activeSounds.delete(audio);
        this.activeSoundCount = Math.max(0, this.activeSoundCount - 1);
      }
      // Remove event listeners to prevent memory leaks
      audio.removeEventListener('ended', cleanup);
      audio.removeEventListener('error', cleanup);
      audio.removeEventListener('pause', cleanup);
    };

    audio.addEventListener('ended', cleanup);
    audio.addEventListener('error', cleanup);
    audio.addEventListener('pause', cleanup);
  }

  /**
   * Manually decrement active sound count (for error cases)
   */
  decrementActiveSoundCount(): void {
    this.activeSoundCount = Math.max(0, this.activeSoundCount - 1);
  }

  /**
   * Reset all state for cleanup
   */
  reset(): void {
    this.isEnabled = true;
    this.isInitialized = false;
    this.activeSounds = new WeakMap();
    this.activeSoundCount = 0;
    this.lastKeystrokeTime = 0;
    this.logger.debug('AudioStateManager reset', 'AudioStateManager');
  }

  /**
   * Get current state summary for debugging
   */
  getStateSummary(): {
    isEnabled: boolean;
    isInitialized: boolean;
    activeSoundCount: number;
    maxConcurrentSounds: number;
  } {
    return {
      isEnabled: this.isEnabled,
      isInitialized: this.isInitialized,
      activeSoundCount: this.activeSoundCount,
      maxConcurrentSounds: this.MAX_CONCURRENT_SOUNDS,
    };
  }
}