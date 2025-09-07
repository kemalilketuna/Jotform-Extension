/**
 * Centralized audio configuration for the extension
 * Manages audio settings, volume levels, and playback parameters
 */
export class AudioConfig {
  // Audio pool management
  static readonly MAX_POOL_SIZE = 10 as const;
  static readonly AUDIO_READY_TIMEOUT = 300 as const;
  static readonly AUDIO_SAFETY_TIMEOUT = 10000 as const;

  // Volume settings
  static readonly VOLUME = {
    DEFAULT: 1.0,
    OVERLAP_REDUCTION: 0.7, // 30% reduction for overlapping sounds
    MUTED: 0.0,
  } as const;

  // Timing for audio effects
  static readonly TIMING = {
    KEYSTROKE_OVERLAP_DELAY: 30, // ms between overlapping keystrokes
    KEYSTROKE_SEQUENCE_DELAY: 20, // ms between sequence sounds
    DEBOUNCE_THRESHOLD: 10, // ms for debouncing
    CLEANUP_DELAY: 50, // ms before cleanup
    FADE_DURATION: 100, // ms for fade effects
  } as const;

  // Audio file paths
  static readonly SOUND_FILES = {
    KEYSTROKE_SOFT: '/sounds/keystrokeSoft.mp3',
    RADIO_SELECT: '/sounds/radioSelect.mp3',
  } as const;

  // Audio states
  static readonly STATES = {
    LOADING: 'loading',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ERROR: 'error',
  } as const;

  // Playback limits
  static readonly LIMITS = {
    MAX_CONCURRENT_SOUNDS: 5,
    MAX_RAPID_FIRE_COUNT: 10,
    RAPID_FIRE_THRESHOLD: 100, // ms - if delay is less than this, it's rapid fire
  } as const;

  /**
   * Calculate volume for overlapping sounds
   */
  static calculateOverlapVolume(
    baseVolume: number = this.VOLUME.DEFAULT
  ): number {
    return baseVolume * this.VOLUME.OVERLAP_REDUCTION;
  }

  /**
   * Check if typing speed qualifies as rapid fire
   */
  static isRapidTyping(delay: number): boolean {
    return delay < this.LIMITS.RAPID_FIRE_THRESHOLD;
  }

  /**
   * Get sound file path by type
   */
  static getSoundPath(soundType: 'keystroke' | 'select'): string {
    switch (soundType) {
      case 'keystroke':
        return this.SOUND_FILES.KEYSTROKE_SOFT;
      case 'select':
        return this.SOUND_FILES.RADIO_SELECT;
      default:
        return this.SOUND_FILES.KEYSTROKE_SOFT;
    }
  }

  /**
   * Calculate delay for overlapping keystroke sounds
   */
  static calculateKeystrokeDelay(index: number): number {
    return index * this.TIMING.KEYSTROKE_OVERLAP_DELAY;
  }

  /**
   * Calculate delay for sequence sounds
   */
  static calculateSequenceDelay(index: number): number {
    return index * this.TIMING.KEYSTROKE_SEQUENCE_DELAY;
  }

  /**
   * Check if audio element is ready for playback
   */
  static isAudioReady(audio: HTMLAudioElement): boolean {
    return audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA;
  }

  /**
   * Get maximum concurrent sounds allowed
   */
  static getMaxConcurrentSounds(): number {
    return this.LIMITS.MAX_CONCURRENT_SOUNDS;
  }

  /**
   * Get rapid fire count limit
   */
  static getRapidFireLimit(): number {
    return this.LIMITS.MAX_RAPID_FIRE_COUNT;
  }
}
