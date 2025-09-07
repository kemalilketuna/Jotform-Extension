import { LoggingService } from '@/services/LoggingService';
import { AudioConfig } from '@/config';

/**
 * Manages audio service state, configuration, and concurrent sound tracking
 */
export class AudioStateManager {
  private readonly logger: LoggingService;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;
  private activeSounds: Set<HTMLAudioElement> = new Set();
  private activeSoundCount: number = 0;
  private lastKeystrokeTime: number = 0;
  private cleanupTimeouts: Map<HTMLAudioElement, number> = new Map();
  private performanceStartTime: number = performance.now();

  private readonly MAX_CONCURRENT_SOUNDS =
    AudioConfig.LIMITS.MAX_CONCURRENT_SOUNDS;
  private readonly DEBOUNCE_THRESHOLD = AudioConfig.TIMING.DEBOUNCE_THRESHOLD;

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
      this.logger.debug(
        'AudioService initialized successfully',
        'AudioStateManager'
      );
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
   * Check if keystroke should be debounced using high-resolution timer
   */
  shouldDebounceKeystroke(): boolean {
    const now = performance.now();
    const timeSinceLastKeystroke = now - this.lastKeystrokeTime;

    if (timeSinceLastKeystroke < this.DEBOUNCE_THRESHOLD) {
      return true;
    }

    this.lastKeystrokeTime = now;
    return false;
  }

  /**
   * Track audio element for proper cleanup and concurrent sound management
   */
  trackAudioElement(audio: HTMLAudioElement): void {
    // Prevent double-tracking
    if (this.activeSounds.has(audio)) {
      return;
    }

    this.activeSounds.add(audio);
    this.activeSoundCount++;

    const cleanup = () => {
      this.cleanupAudioElement(audio);
    };

    // Add event listeners with once: true to prevent memory leaks
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    audio.addEventListener('pause', cleanup, { once: true });

    // Add safety timeout to prevent stuck audio elements
    const timeoutId = window.setTimeout(() => {
      this.cleanupAudioElement(audio);
    }, AudioConfig.AUDIO_SAFETY_TIMEOUT);

    this.cleanupTimeouts.set(audio, timeoutId);
  }

  /**
   * Manually decrement active sound count (for error cases)
   */
  decrementActiveSoundCount(): void {
    this.activeSoundCount = Math.max(0, this.activeSoundCount - 1);
  }

  /**
   * Clean up a specific audio element and its tracking
   */
  private cleanupAudioElement(audio: HTMLAudioElement): void {
    if (this.activeSounds.has(audio)) {
      this.activeSounds.delete(audio);
      this.activeSoundCount = Math.max(0, this.activeSoundCount - 1);
    }

    // Clear safety timeout
    const timeoutId = this.cleanupTimeouts.get(audio);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.cleanupTimeouts.delete(audio);
    }
  }

  /**
   * Reset all state for cleanup
   */
  reset(): void {
    // Clean up all active sounds and timeouts
    this.cleanupTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.cleanupTimeouts.clear();

    this.isEnabled = true;
    this.isInitialized = false;
    this.activeSounds.clear();
    this.activeSoundCount = 0;
    this.lastKeystrokeTime = 0;
    this.performanceStartTime = performance.now();
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
