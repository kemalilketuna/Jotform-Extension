/**
 * String constants for RainbowBorderService
 * Centralized management of all rainbow border related strings
 */
export class RainbowBorderStrings {
  // CSS Animation Names
  static readonly ANIMATION_NAME = 'rainbowBorderRotation' as const;

  // CSS Class Names
  static readonly RAINBOW_BORDER_CLASS = 'extensionRainbowBorder' as const;
  static readonly RAINBOW_GLOW_CLASS = 'extensionRainbowGlow' as const;

  // Log Messages
  static readonly LOG_MESSAGES = {
    BORDER_ADDED: 'Rainbow border added to element',
    BORDER_REMOVED: 'Rainbow border removed from element',
    BORDER_CLEANUP: 'Rainbow border cleanup completed',
    ANIMATION_STARTED: 'Rainbow border animation started',
    ANIMATION_STOPPED: 'Rainbow border animation stopped',
  } as const;

  // Error Messages
  static readonly ERROR_MESSAGES = {
    INVALID_ELEMENT: 'Invalid element provided for rainbow border',
    ANIMATION_FAILED: 'Failed to start rainbow border animation',
    CLEANUP_FAILED: 'Failed to cleanup rainbow borders',
  } as const;

  // CSS Keyframe Animation
  static readonly CSS_KEYFRAMES = `
    @keyframes ${RainbowBorderStrings.ANIMATION_NAME} {
      0% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(0deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      8.33% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(30deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      16.66% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(60deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      25% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      33.33% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(120deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      41.66% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(150deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      50% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(180deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      58.33% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(210deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      66.66% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(240deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      75% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(270deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      83.33% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(300deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      91.66% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(330deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
      100% { 
        background: linear-gradient(white, white) padding-box,
                   linear-gradient(360deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080) border-box;
      }
    }
  ` as const;
}
