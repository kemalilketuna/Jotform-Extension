import { CursorPosition } from '@/types';
import { LoggingService } from '@/services/LoggingService';
import { VisualCursorConfig } from './VisualCursorConfig';
import {
  CursorInitializationError,
  CursorStyleError,
} from './VisualCursorErrors';
import cursorStyles from '@/assets/cursor.css?inline';
import cursorTemplate from '@/assets/cursor.html?raw';

/**
 * Manages DOM operations and styling for the visual cursor
 */
export class CursorDOMManager {
  private cursorElement: HTMLElement | null = null;
  private styleObserver: MutationObserver | null = null;

  constructor(private readonly logger: LoggingService) {}

  /**
   * Create and initialize the cursor DOM element
   */
  createCursorElement(): HTMLElement {
    if (this.cursorElement) {
      throw new CursorInitializationError('Cursor element already exists');
    }

    this.cursorElement = document.createElement('div');
    this.cursorElement.id = VisualCursorConfig.DOM_ATTRIBUTES.cursorId;
    this.cursorElement.innerHTML = cursorTemplate;

    this.applyCoreStyles();
    this.setDOMAttributes();
    this.attachToDOM();
    this.attachStyles();
    this.ensureStyleIsolation();

    this.logger.debug('Cursor DOM element created', 'CursorDOMManager');
    return this.cursorElement;
  }

  /**
   * Remove cursor element from DOM and clean up
   */
  destroyCursorElement(): void {
    if (this.styleObserver) {
      this.styleObserver.disconnect();
      this.styleObserver = null;
    }

    if (this.cursorElement) {
      this.cursorElement.remove();
      this.cursorElement = null;
    }

    this.removeStyles();
    this.logger.debug('Cursor DOM element destroyed', 'CursorDOMManager');
  }

  /**
   * Update cursor position in DOM
   */
  updatePosition(position: CursorPosition): void {
    if (!this.cursorElement) {
      throw new CursorStyleError(
        'Cannot update position: cursor element not found'
      );
    }

    const { offsetX, offsetY } = VisualCursorConfig.CURSOR_DIMENSIONS;
    this.cursorElement.style.transform = `translate(${position.x - offsetX}px, ${position.y - offsetY}px)`;
  }

  /**
   * Show the cursor element
   */
  show(): void {
    if (!this.cursorElement) {
      throw new CursorStyleError('Cannot show: cursor element not found');
    }

    this.reapplyStyles();
    this.cursorElement.style.display = 'block';
    this.cursorElement.style.opacity = '1';
  }

  /**
   * Hide the cursor element
   */
  hide(): void {
    if (!this.cursorElement) {
      return;
    }

    this.cursorElement.style.opacity = '0';
    setTimeout(() => {
      if (this.cursorElement && this.cursorElement.style.opacity === '0') {
        this.cursorElement.style.display = 'none';
      }
    }, VisualCursorConfig.TIMING_CONSTANTS.fadeTransition);
  }

  /**
   * Add CSS class to cursor element
   */
  addClass(className: string): void {
    if (!this.cursorElement) {
      throw new CursorStyleError('Cannot add class: cursor element not found');
    }
    this.cursorElement.classList.add(className);
  }

  /**
   * Remove CSS class from cursor element
   */
  removeClass(className: string): void {
    if (!this.cursorElement) {
      return;
    }
    this.cursorElement.classList.remove(className);
  }

  /**
   * Get cursor element reference
   */
  getElement(): HTMLElement | null {
    return this.cursorElement;
  }

  /**
   * Apply core styles that ensure proper positioning and isolation
   */
  private applyCoreStyles(): void {
    if (!this.cursorElement) {
      return;
    }

    const { width, height } = VisualCursorConfig.CURSOR_DIMENSIONS;
    const { maxZIndex } = VisualCursorConfig.TIMING_CONSTANTS;

    const styles = {
      position: 'fixed',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      zIndex: maxZIndex.toString(),
      display: 'none',
      transition: 'opacity 0.2s ease',
      width: `${width}px`,
      height: `${height}px`,
      margin: '0',
      padding: '0',
      border: 'none',
      background: 'transparent',
      boxSizing: 'border-box',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      lineHeight: '1',
      color: 'initial',
      textAlign: 'left',
      direction: 'ltr',
      unicodeBidi: 'normal',
      whiteSpace: 'normal',
      wordSpacing: 'normal',
      letterSpacing: 'normal',
      textTransform: 'none',
      textIndent: '0',
      textShadow: 'none',
      userSelect: 'none',
      webkitUserSelect: 'none',
      mozUserSelect: 'none',
      msUserSelect: 'none',
      overflow: 'visible',
      opacity: '1',
      visibility: 'visible',
      animation: 'none',
      filter: 'none',
      backdropFilter: 'none',
      clip: 'auto',
      clipPath: 'none',
      mask: 'none',
      mixBlendMode: 'normal',
    };

    Object.entries(styles).forEach(([property, value]) => {
      (
        this.cursorElement!.style as CSSStyleDeclaration &
          Record<string, string>
      )[property] = value;
    });
  }

  /**
   * Set DOM attributes for accessibility and identification
   */
  private setDOMAttributes(): void {
    if (!this.cursorElement) {
      return;
    }

    const { dataAttribute, role, ariaHidden } =
      VisualCursorConfig.DOM_ATTRIBUTES;
    this.cursorElement.setAttribute(dataAttribute, 'true');
    this.cursorElement.setAttribute('role', role);
    this.cursorElement.setAttribute('aria-hidden', ariaHidden);
  }

  /**
   * Attach cursor element to DOM
   */
  private attachToDOM(): void {
    if (!this.cursorElement) {
      return;
    }
    document.body.appendChild(this.cursorElement);
  }

  /**
   * Attach CSS styles for cursor animations
   */
  private attachStyles(): void {
    const { styleId } = VisualCursorConfig.DOM_ATTRIBUTES;
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cursorStyles;
    document.head.appendChild(style);
  }

  /**
   * Remove injected styles from DOM
   */
  private removeStyles(): void {
    const { styleId } = VisualCursorConfig.DOM_ATTRIBUTES;
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * Ensure the visual cursor is properly isolated from page styles
   */
  private ensureStyleIsolation(): void {
    if (!this.cursorElement) {
      return;
    }

    this.styleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'style'
        ) {
          this.reapplyStyles();
        }
      });
    });

    this.styleObserver.observe(this.cursorElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  /**
   * Re-apply critical styles to maintain visual cursor integrity
   */
  private reapplyStyles(): void {
    if (!this.cursorElement) {
      return;
    }

    const { maxZIndex } = VisualCursorConfig.TIMING_CONSTANTS;
    const criticalStyles = {
      position: 'fixed',
      zIndex: maxZIndex.toString(),
      pointerEvents: 'none',
      userSelect: 'none',
      webkitUserSelect: 'none',
      mozUserSelect: 'none',
      msUserSelect: 'none',
    };

    this.detectStyleConflicts(criticalStyles);

    Object.entries(criticalStyles).forEach(([property, value]) => {
      (
        this.cursorElement!.style as CSSStyleDeclaration &
          Record<string, string>
      )[property] = value;
    });
  }

  /**
   * Detect and log potential style conflicts
   */
  private detectStyleConflicts(expectedStyles: Record<string, string>): void {
    if (!this.cursorElement) {
      return;
    }

    const computedStyles = window.getComputedStyle(this.cursorElement);
    const conflicts: string[] = [];

    Object.entries(expectedStyles).forEach(([property, expectedValue]) => {
      const actualValue = (
        computedStyles as CSSStyleDeclaration & Record<string, string>
      )[property];
      if (actualValue && actualValue !== expectedValue) {
        conflicts.push(
          `${property}: expected '${expectedValue}', got '${actualValue}'`
        );
      }
    });

    if (conflicts.length > 0) {
      this.logger.warn(
        `Visual cursor style conflicts detected: ${conflicts.join(', ')}`,
        'CursorDOMManager'
      );
    }
  }
}
