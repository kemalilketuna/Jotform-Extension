/**
 * Centralized DOM configuration for the extension
 * Manages DOM detection limits, selectors, and analysis parameters
 */
export class DOMConfig {
  // DOM analysis limits
  static readonly MAX_DEPTH = 50 as const;
  static readonly MIN_SCROLLABLE_SIZE = 50 as const;
  static readonly MAX_ELEMENT_WAIT_ATTEMPTS = 50 as const;

  // Element detection thresholds
  static readonly ELEMENT_VISIBILITY = {
    MIN_WIDTH: 1,
    MIN_HEIGHT: 1,
    MIN_OPACITY: 0.1,
  } as const;

  // Text content limits
  static readonly TEXT_LIMITS = {
    PREVIEW_LENGTH: 50,
    MAX_CONTENT_LENGTH: 1000,
    TRUNCATION_SUFFIX: '...',
  } as const;

  // CSS selector patterns
  static readonly SELECTORS = {
    // Form elements
    FORM_INPUTS: 'input, textarea, select',
    CLICKABLE_ELEMENTS:
      'button, a, input[type="button"], input[type="submit"], [role="button"]',
    INTERACTIVE_ELEMENTS:
      'input, textarea, select, button, a, [tabindex], [role="button"], [role="link"]',

    // Visibility selectors
    VISIBLE_ELEMENTS:
      ':not([hidden]):not([style*="display: none"]):not([style*="visibility: hidden"])',
    SCROLLABLE_ELEMENTS: '[style*="overflow"], [style*="scroll"]',

    // Content selectors
    TEXT_ELEMENTS: 'p, span, div, h1, h2, h3, h4, h5, h6, label, td, th, li',
    HEADING_ELEMENTS: 'h1, h2, h3, h4, h5, h6',

    // Extension-specific
    EXTENSION_COMPONENTS: '[data-extension-component]',
    JOTFORM_ELEMENTS: '[class*="jotform"], [id*="jotform"]',
  } as const;

  // DOM mutation observer configuration
  static readonly MUTATION_OBSERVER = {
    ATTRIBUTES: true,
    CHILD_LIST: true,
    SUBTREE: true,
    ATTRIBUTE_OLD_VALUE: false,
    CHARACTER_DATA: false,
    CHARACTER_DATA_OLD_VALUE: false,
  } as const;

  // Element attribute names
  static readonly ATTRIBUTES = {
    ID: 'id',
    CLASS: 'class',
    NAME: 'name',
    TYPE: 'type',
    VALUE: 'value',
    PLACEHOLDER: 'placeholder',
    ARIA_LABEL: 'aria-label',
    TITLE: 'title',
    ALT: 'alt',
    HREF: 'href',
    SRC: 'src',
    ROLE: 'role',
    TABINDEX: 'tabindex',
    DATA_EXTENSION: 'data-extension-component',
  } as const;

  // Element states
  static readonly ELEMENT_STATES = {
    DISABLED: 'disabled',
    READONLY: 'readonly',
    HIDDEN: 'hidden',
    CHECKED: 'checked',
    SELECTED: 'selected',
    REQUIRED: 'required',
  } as const;

  // CSS properties for element analysis
  static readonly CSS_PROPERTIES = {
    DISPLAY: 'display',
    VISIBILITY: 'visibility',
    OPACITY: 'opacity',
    POSITION: 'position',
    Z_INDEX: 'z-index',
    WIDTH: 'width',
    HEIGHT: 'height',
    OVERFLOW: 'overflow',
    OVERFLOW_X: 'overflow-x',
    OVERFLOW_Y: 'overflow-y',
  } as const;

  // DOM ready states
  static readonly READY_STATES = {
    LOADING: 'loading',
    INTERACTIVE: 'interactive',
    COMPLETE: 'complete',
  } as const;

  // Event types for DOM interaction
  static readonly EVENTS = {
    CLICK: 'click',
    INPUT: 'input',
    CHANGE: 'change',
    FOCUS: 'focus',
    BLUR: 'blur',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    MOUSEDOWN: 'mousedown',
    MOUSEUP: 'mouseup',
    MOUSEOVER: 'mouseover',
    MOUSEOUT: 'mouseout',
    LOAD: 'load',
    DOM_CONTENT_LOADED: 'DOMContentLoaded',
    MUTATION: 'mutation',
  } as const;

  // Element priority weights for selection
  static readonly ELEMENT_PRIORITIES = {
    FORM_INPUT: 10,
    BUTTON: 8,
    LINK: 6,
    CLICKABLE: 5,
    TEXT: 3,
    CONTAINER: 1,
  } as const;

  /**
   * Check if element is visible based on computed styles
   */
  static isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width >= this.ELEMENT_VISIBILITY.MIN_WIDTH &&
      rect.height >= this.ELEMENT_VISIBILITY.MIN_HEIGHT &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      parseFloat(style.opacity) >= this.ELEMENT_VISIBILITY.MIN_OPACITY
    );
  }

  /**
   * Check if element is interactive
   */
  static isElementInteractive(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute(this.ATTRIBUTES.ROLE);
    const tabindex = element.getAttribute(this.ATTRIBUTES.TABINDEX);

    return (
      ['input', 'textarea', 'select', 'button', 'a'].includes(tagName) ||
      ['button', 'link', 'textbox'].includes(role || '') ||
      tabindex !== null
    );
  }

  /**
   * Get element priority for selection algorithms
   */
  static getElementPriority(element: Element): number {
    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute(this.ATTRIBUTES.TYPE);
    const role = element.getAttribute(this.ATTRIBUTES.ROLE);

    if (['input', 'textarea', 'select'].includes(tagName)) {
      return this.ELEMENT_PRIORITIES.FORM_INPUT;
    }

    if (
      tagName === 'button' ||
      type === 'button' ||
      type === 'submit' ||
      role === 'button'
    ) {
      return this.ELEMENT_PRIORITIES.BUTTON;
    }

    if (tagName === 'a' || role === 'link') {
      return this.ELEMENT_PRIORITIES.LINK;
    }

    if (this.isElementInteractive(element)) {
      return this.ELEMENT_PRIORITIES.CLICKABLE;
    }

    if (this.SELECTORS.TEXT_ELEMENTS.includes(tagName)) {
      return this.ELEMENT_PRIORITIES.TEXT;
    }

    return this.ELEMENT_PRIORITIES.CONTAINER;
  }

  /**
   * Truncate text content to specified length
   */
  static truncateText(
    text: string,
    maxLength: number = this.TEXT_LIMITS.PREVIEW_LENGTH
  ): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + this.TEXT_LIMITS.TRUNCATION_SUFFIX;
  }

  /**
   * Generate CSS selector for element
   */
  static generateSelector(element: Element): string {
    const id = element.getAttribute(this.ATTRIBUTES.ID);
    if (id) {
      return `#${id}`;
    }

    const className = element.getAttribute(this.ATTRIBUTES.CLASS);
    if (className) {
      const classes = className.split(' ').filter((cls) => cls.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    return element.tagName.toLowerCase();
  }
}
