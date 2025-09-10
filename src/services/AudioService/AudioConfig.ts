/**
 * Audio file paths managed through OOP pattern
 */
export class AudioPaths {
  static readonly CLICK_SOUND = 'sounds/radioSelect.mp3' as const;
  static readonly KEYSTROKE_SOUND = 'sounds/keystrokeSoft.mp3' as const;
}

/**
 * Audio configuration constants
 */
export class AudioConfig {
  static readonly DEFAULT_VOLUME = 1.0 as const;
  static readonly KEYSTROKE_VOLUME = 0.6 as const; // Increased for better audibility
  static readonly KEYSTROKE_VOLUME_MIN = 0.5 as const; // Minimum volume for variation
  static readonly KEYSTROKE_VOLUME_MAX = 0.8 as const; // Maximum volume for variation
  static readonly PRELOAD_POLICY = 'metadata' as const; // Changed from 'auto' to prevent corruption
}
