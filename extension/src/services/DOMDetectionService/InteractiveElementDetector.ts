import { InteractiveElement, InteractiveElementType, DOMDetectionConfig, ElementVisibilityInfo } from './DOMDetectionTypes.ts';
import { ElementSelectors } from './ElementSelectors.ts';
import { VisibilityDetectionError } from './DOMDetectionErrors.ts';
import { JSPathGenerator } from './JSPathGenerator.ts';

export class InteractiveElementDetector {
  private static readonly VIEWPORT_MARGIN = 10;
  private static readonly MIN_ELEMENT_SIZE = 5;
  
  /**
   * Finds all interactive elements in the document
   */
  static findInteractiveElements(config?: Partial<DOMDetectionConfig>): InteractiveElement[] {
    const finalConfig = this.mergeConfig(config);
    const interactiveElements: InteractiveElement[] = [];
    
    try {
      const elements = document.querySelectorAll(ElementSelectors.ALL_INTERACTIVE);
      
      for (const element of elements) {
        if (this.shouldExcludeElement(element as HTMLElement, finalConfig)) {
          continue;
        }
        
        try {
          const interactiveElement = this.analyzeInteractiveElement(element as HTMLElement, finalConfig);
          if (interactiveElement) {
            interactiveElements.push(interactiveElement);
          }
        } catch (error) {
          console.warn('Failed to analyze interactive element:', error);
        }
      }
      
      return this.sortByVisibilityAndPosition(interactiveElements);
      
    } catch (error) {
      throw new VisibilityDetectionError(document.body, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Finds only visible interactive elements
   */
  static findVisibleInteractiveElements(config?: Partial<DOMDetectionConfig>): InteractiveElement[] {
    const allElements = this.findInteractiveElements(config);
    return allElements.filter(element => element.isVisible);
  }
  
  /**
   * Finds interactive elements by type
   */
  static findElementsByType(type: InteractiveElementType, config?: Partial<DOMDetectionConfig>): InteractiveElement[] {
    const allElements = this.findInteractiveElements(config);
    return allElements.filter(element => element.type === type);
  }
  
  /**
   * Checks if an element is interactive
   */
  static isElementInteractive(element: HTMLElement): boolean {
    return element.matches(ElementSelectors.ALL_INTERACTIVE);
  }
  
  /**
   * Gets detailed visibility information for an element
   */
  static getElementVisibility(element: HTMLElement): ElementVisibilityInfo {
    try {
      const computedStyle = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      
      const isVisible = this.isElementVisible(element, computedStyle, rect);
      const isInViewport = this.isElementInViewport(rect);
      
      return {
        isVisible,
        isInViewport,
        opacity: parseFloat(computedStyle.opacity),
        display: computedStyle.display,
        visibility: computedStyle.visibility
      };
    } catch (error) {
      throw new VisibilityDetectionError(element, error instanceof Error ? error.message : 'Visibility check failed');
    }
  }
  
  private static analyzeInteractiveElement(
    element: HTMLElement,
    config: DOMDetectionConfig
  ): InteractiveElement | null {
    try {
      const computedStyle = window.getComputedStyle(element);
      const boundingRect = element.getBoundingClientRect();
      
      const isVisible = config.includeHiddenElements || this.isElementVisible(element, computedStyle, boundingRect);
      
      if (!isVisible && !config.includeHiddenElements) {
        return null;
      }
      
      const type = this.determineElementType(element);
      const jsPath = JSPathGenerator.generatePath(element);
      const attributes = this.extractRelevantAttributes(element);
      
      return {
        element,
        jsPath,
        type,
        isVisible,
        boundingRect,
        tagName: element.tagName.toLowerCase(),
        attributes
      };
      
    } catch (error) {
      throw new VisibilityDetectionError(element, error instanceof Error ? error.message : 'Analysis failed');
    }
  }
  
  private static determineElementType(element: HTMLElement): InteractiveElementType {
    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type')?.toLowerCase();
    const role = element.getAttribute('role')?.toLowerCase();
    
    // Button elements
    if (tagName === 'button' || type === 'button' || type === 'submit' || type === 'reset') {
      return type === 'submit' ? 'submit' : 'button';
    }
    
    // Link elements
    if (tagName === 'a' && element.hasAttribute('href')) {
      return 'link';
    }
    
    // Input elements
    if (tagName === 'input') {
      switch (type) {
        case 'text':
        case 'email':
        case 'password':
        case 'search':
        case 'tel':
        case 'url':
        case 'number':
        case 'date':
        case 'time':
        case 'datetime-local':
        case 'month':
        case 'week':
        case 'color':
        case 'range':
          return 'input';
        case 'checkbox':
          return 'checkbox';
        case 'radio':
          return 'radio';
        default:
          return 'input';
      }
    }
    
    // Other form elements
    if (tagName === 'textarea') {
      return 'textarea';
    }
    
    if (tagName === 'select') {
      return 'select';
    }
    
    // Role-based detection
    if (role === 'button') {
      return 'button';
    }
    
    // Clickable elements
    if (element.hasAttribute('onclick') || element.getAttribute('tabindex') === '0') {
      return 'clickable';
    }
    
    return 'clickable';
  }
  
  private static isElementVisible(
    element: HTMLElement,
    computedStyle: CSSStyleDeclaration,
    rect: DOMRect
  ): boolean {
    // Check CSS visibility
    if (computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        parseFloat(computedStyle.opacity) === 0) {
      return false;
    }
    
    // Check if element has meaningful size
    if (rect.width < this.MIN_ELEMENT_SIZE || rect.height < this.MIN_ELEMENT_SIZE) {
      return false;
    }
    
    // Check if element is clipped
    if (computedStyle.clip && computedStyle.clip !== 'auto') {
      return false;
    }
    
    // Check if element is positioned off-screen
    if (rect.right < 0 || rect.bottom < 0 ||
        rect.left > window.innerWidth || rect.top > window.innerHeight) {
      return false;
    }
    
    return true;
  }
  
  private static isElementInViewport(rect: DOMRect): boolean {
    return (
      rect.top >= -this.VIEWPORT_MARGIN &&
      rect.left >= -this.VIEWPORT_MARGIN &&
      rect.bottom <= window.innerHeight + this.VIEWPORT_MARGIN &&
      rect.right <= window.innerWidth + this.VIEWPORT_MARGIN
    );
  }
  
  private static extractRelevantAttributes(element: HTMLElement): Record<string, string> {
    const relevantAttributes = [
      'id', 'class', 'name', 'type', 'role', 'aria-label', 'aria-labelledby',
      'title', 'placeholder', 'value', 'href', 'target', 'disabled', 'readonly'
    ];
    
    const attributes: Record<string, string> = {};
    
    for (const attr of relevantAttributes) {
      const value = element.getAttribute(attr);
      if (value !== null) {
        attributes[attr] = value;
      }
    }
    
    return attributes;
  }
  
  private static shouldExcludeElement(element: HTMLElement, config: DOMDetectionConfig): boolean {
    // Check against exclusion selectors
    for (const selector of config.excludeSelectors) {
      if (element.matches(selector)) {
        return true;
      }
    }
    
    // Exclude disabled elements
    if (element.hasAttribute('disabled')) {
      return true;
    }
    
    // Exclude hidden form elements
    if (element.getAttribute('type') === 'hidden') {
      return true;
    }
    
    return false;
  }
  
  private static sortByVisibilityAndPosition(elements: InteractiveElement[]): InteractiveElement[] {
    return elements.sort((a, b) => {
      // Visible elements first
      if (a.isVisible !== b.isVisible) {
        return a.isVisible ? -1 : 1;
      }
      
      // Then by vertical position (top to bottom)
      const topDiff = a.boundingRect.top - b.boundingRect.top;
      if (Math.abs(topDiff) > 10) {
        return topDiff;
      }
      
      // Then by horizontal position (left to right)
      return a.boundingRect.left - b.boundingRect.left;
    });
  }
  
  private static mergeConfig(config?: Partial<DOMDetectionConfig>): DOMDetectionConfig {
    return {
      includeHiddenElements: false,
      minScrollableSize: 50,
      maxDepth: 50,
      excludeSelectors: [ElementSelectors.ALL_EXCLUDED],
      ...config
    };
  }
}