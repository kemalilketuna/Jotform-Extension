export interface CursorPosition {
  x: number;
  y: number;
}

export interface VisualAnimationConfig {
  enabled: boolean;
  animationSpeed: number; // ms per pixel
  hoverDuration: number; // ms to hover before click
  clickDuration: number; // ms for click animation
}

export interface VisualCursorState {
  isVisible: boolean;
  position: CursorPosition;
  isAnimating: boolean;
  isHovering: boolean;
  isClicking: boolean;
}
