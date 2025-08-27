/**
 * Audio file paths managed through OOP pattern
 */
export class AudioPaths {
  static readonly CLICK_SOUND = 'sounds/radio_select.mp3' as const;
  static readonly KEYSTROKE_SOUND = 'sounds/keystroke_soft.mp3' as const;
}

/**
 * Audio configuration constants
 */
export class AudioConfig {
  static readonly DEFAULT_VOLUME = 0.7 as const;
  static readonly KEYSTROKE_VOLUME = 0.5 as const;
  static readonly PRELOAD_POLICY = 'auto' as const;
}
