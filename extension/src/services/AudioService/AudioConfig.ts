/**
 * Audio file paths managed through OOP pattern
 */
export class AudioPaths {
  static readonly CLICK_SOUND = 'sounds/radio-select.mp3' as const;
  static readonly KEYSTROKE_SOUND = 'sounds/keystroke-soft.mp3' as const;
}

/**
 * Audio configuration constants
 */
export class AudioConfig {
  static readonly DEFAULT_VOLUME = 0.6 as const;
  static readonly KEYSTROKE_VOLUME = 0.3 as const; // Reduced to minimize noise from overlapping sounds
  static readonly KEYSTROKE_VOLUME_MIN = 0.2 as const; // Minimum volume for variation
  static readonly KEYSTROKE_VOLUME_MAX = 0.4 as const; // Maximum volume for variation
  static readonly PRELOAD_POLICY = 'metadata' as const; // Changed from 'auto' to prevent corruption
}
