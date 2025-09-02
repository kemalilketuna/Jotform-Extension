export class ElementSelectors {
  // Interactive element selectors
  static readonly BUTTONS = 'button, input[type="button"], input[type="submit"], input[type="reset"]' as const;
  static readonly LINKS = 'a[href], area[href]' as const;
  static readonly INPUTS = 'input:not([type="hidden"]), textarea, select' as const;
  static readonly FORM_CONTROLS = 'input, textarea, select, button' as const;
  static readonly CLICKABLE_ELEMENTS = '[onclick], [role="button"], [tabindex="0"]' as const;
  
  // Scrollable element selectors
  static readonly SCROLLABLE_CONTAINERS = 'div, section, article, main, aside, nav, ul, ol' as const;
  static readonly OVERFLOW_ELEMENTS = '[style*="overflow"]' as const;
  
  // Visibility and layout selectors
  static readonly HIDDEN_ELEMENTS = '[hidden], [style*="display: none"], [style*="visibility: hidden"]' as const;
  static readonly VISIBLE_ELEMENTS = ':not([hidden]):not([style*="display: none"]):not([style*="visibility: hidden"])' as const;
  
  // Exclusion selectors
  static readonly EXCLUDE_SCRIPT_STYLE = 'script, style, noscript' as const;
  static readonly EXCLUDE_META = 'meta, link[rel], title' as const;
  static readonly EXCLUDE_EXTENSION = '[data-extension], [class*="extension"]' as const;
  
  // Combined selectors
  static readonly ALL_INTERACTIVE = 'button, input[type="button"], input[type="submit"], input[type="reset"], a[href], area[href], input:not([type="hidden"]), textarea, select, [onclick], [role="button"], [tabindex="0"]' as const;
  
  static readonly ALL_EXCLUDED = 'script, style, noscript, meta, link[rel], title, [data-extension], [class*="extension"]' as const;
  
  // CSS properties for scroll detection
  static readonly SCROLL_PROPERTIES = {
    OVERFLOW: 'overflow',
    OVERFLOW_X: 'overflow-x',
    OVERFLOW_Y: 'overflow-y',
    SCROLL_BEHAVIOR: 'scroll-behavior'
  } as const;
  
  // Scroll values
  static readonly SCROLL_VALUES = {
    AUTO: 'auto',
    SCROLL: 'scroll',
    HIDDEN: 'hidden',
    VISIBLE: 'visible'
  } as const;
}