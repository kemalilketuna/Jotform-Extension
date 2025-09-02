import { ScrollableArea, DOMDetectionConfig } from './DOMDetectionTypes.ts';
import { ElementSelectors } from './ElementSelectors.ts';
import { ScrollDetectionError } from './DOMDetectionErrors.ts';
import { JSPathGenerator } from './JSPathGenerator.ts';

export class ScrollableAreaDetector {
  private static readonly DEFAULT_MIN_SIZE = 50;
  private static readonly SCROLL_THRESHOLD = 5;
  
  /**
   * Finds all scrollable areas in the document
   */
  static findScrollableAreas(config?: Partial<DOMDetectionConfig>): ScrollableArea[] {
    const finalConfig = this.mergeConfig(config);
    const scrollableAreas: ScrollableArea[] = [];
    
    try {
      // Check document body and html
      const documentScrollable = this.checkDocumentScrollable();
      if (documentScrollable) {
        scrollableAreas.push(documentScrollable);
      }
      
      // Find all potential scrollable containers
      const containers = document.querySelectorAll(ElementSelectors.SCROLLABLE_CONTAINERS);
      
      for (const container of containers) {
        if (this.shouldExcludeElement(container as HTMLElement, finalConfig)) {
          continue;
        }
        
        try {
          const scrollableArea = this.analyzeScrollableElement(container as HTMLElement);
          if (scrollableArea && this.meetsMinimumSize(scrollableArea, finalConfig)) {
            scrollableAreas.push(scrollableArea);
          }
        } catch (error) {
          console.warn('Failed to analyze scrollable element:', error);
        }
      }
      
      // Remove duplicates and sort by size
      return this.deduplicateAndSort(scrollableAreas);
      
    } catch (error) {
      throw new ScrollDetectionError(document.body, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Checks if a specific element is scrollable
   */
  static isElementScrollable(element: HTMLElement): boolean {
    try {
      const computedStyle = window.getComputedStyle(element);
      const hasScrollableContent = this.hasScrollableContent(element);
      const hasScrollableStyle = this.hasScrollableOverflow(computedStyle);
      
      return hasScrollableContent && hasScrollableStyle;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Gets detailed scroll information for an element
   */
  static getScrollInfo(element: HTMLElement): Partial<ScrollableArea> | null {
    try {
      return this.analyzeScrollableElement(element);
    } catch (error) {
      return null;
    }
  }
  
  private static checkDocumentScrollable(): ScrollableArea | null {
    const body = document.body;
    const html = document.documentElement;
    
    if (!body || !html) return null;
    
    const bodyScrollable = this.analyzeScrollableElement(body);
    const htmlScrollable = this.analyzeScrollableElement(html);
    
    // Return the one with actual scrollable content
    if (bodyScrollable && (bodyScrollable.isVerticallyScrollable || bodyScrollable.isHorizontallyScrollable)) {
      return bodyScrollable;
    }
    
    if (htmlScrollable && (htmlScrollable.isVerticallyScrollable || htmlScrollable.isHorizontallyScrollable)) {
      return htmlScrollable;
    }
    
    return null;
  }
  
  private static analyzeScrollableElement(element: HTMLElement): ScrollableArea | null {
    try {
      const computedStyle = window.getComputedStyle(element);
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      const scrollWidth = element.scrollWidth;
      const clientWidth = element.clientWidth;
      
      const isVerticallyScrollable = this.isVerticallyScrollable(element, computedStyle, scrollHeight, clientHeight);
      const isHorizontallyScrollable = this.isHorizontallyScrollable(element, computedStyle, scrollWidth, clientWidth);
      
      if (!isVerticallyScrollable && !isHorizontallyScrollable) {
        return null;
      }
      
      const jsPath = JSPathGenerator.generatePath(element);
      
      return {
        element,
        jsPath,
        scrollHeight,
        clientHeight,
        scrollWidth,
        clientWidth,
        isVerticallyScrollable,
        isHorizontallyScrollable
      };
      
    } catch (error) {
      throw new ScrollDetectionError(element, error instanceof Error ? error.message : 'Analysis failed');
    }
  }
  
  private static isVerticallyScrollable(
    element: HTMLElement,
    computedStyle: CSSStyleDeclaration,
    scrollHeight: number,
    clientHeight: number
  ): boolean {
    const overflowY = computedStyle.overflowY;
    const overflow = computedStyle.overflow;
    
    const hasScrollableOverflow = (
      overflowY === ElementSelectors.SCROLL_VALUES.AUTO ||
      overflowY === ElementSelectors.SCROLL_VALUES.SCROLL ||
      overflow === ElementSelectors.SCROLL_VALUES.AUTO ||
      overflow === ElementSelectors.SCROLL_VALUES.SCROLL
    );
    
    const hasScrollableContent = scrollHeight > clientHeight + this.SCROLL_THRESHOLD;
    
    return hasScrollableOverflow && hasScrollableContent;
  }
  
  private static isHorizontallyScrollable(
    element: HTMLElement,
    computedStyle: CSSStyleDeclaration,
    scrollWidth: number,
    clientWidth: number
  ): boolean {
    const overflowX = computedStyle.overflowX;
    const overflow = computedStyle.overflow;
    
    const hasScrollableOverflow = (
      overflowX === ElementSelectors.SCROLL_VALUES.AUTO ||
      overflowX === ElementSelectors.SCROLL_VALUES.SCROLL ||
      overflow === ElementSelectors.SCROLL_VALUES.AUTO ||
      overflow === ElementSelectors.SCROLL_VALUES.SCROLL
    );
    
    const hasScrollableContent = scrollWidth > clientWidth + this.SCROLL_THRESHOLD;
    
    return hasScrollableOverflow && hasScrollableContent;
  }
  
  private static hasScrollableContent(element: HTMLElement): boolean {
    return (
      element.scrollHeight > element.clientHeight + this.SCROLL_THRESHOLD ||
      element.scrollWidth > element.clientWidth + this.SCROLL_THRESHOLD
    );
  }
  
  private static hasScrollableOverflow(computedStyle: CSSStyleDeclaration): boolean {
    const overflow = computedStyle.overflow;
    const overflowX = computedStyle.overflowX;
    const overflowY = computedStyle.overflowY;
    
    return (
      overflow === ElementSelectors.SCROLL_VALUES.AUTO ||
      overflow === ElementSelectors.SCROLL_VALUES.SCROLL ||
      overflowX === ElementSelectors.SCROLL_VALUES.AUTO ||
      overflowX === ElementSelectors.SCROLL_VALUES.SCROLL ||
      overflowY === ElementSelectors.SCROLL_VALUES.AUTO ||
      overflowY === ElementSelectors.SCROLL_VALUES.SCROLL
    );
  }
  
  private static shouldExcludeElement(element: HTMLElement, config: DOMDetectionConfig): boolean {
    // Check against exclusion selectors
    for (const selector of config.excludeSelectors) {
      if (element.matches(selector)) {
        return true;
      }
    }
    
    // Exclude hidden elements if configured
    if (!config.includeHiddenElements && !this.isElementVisible(element)) {
      return true;
    }
    
    return false;
  }
  
  private static isElementVisible(element: HTMLElement): boolean {
    const computedStyle = window.getComputedStyle(element);
    return (
      computedStyle.display !== 'none' &&
      computedStyle.visibility !== 'hidden' &&
      parseFloat(computedStyle.opacity) > 0
    );
  }
  
  private static meetsMinimumSize(scrollableArea: ScrollableArea, config: DOMDetectionConfig): boolean {
    return (
      scrollableArea.clientHeight >= config.minScrollableSize ||
      scrollableArea.clientWidth >= config.minScrollableSize
    );
  }
  
  private static deduplicateAndSort(scrollableAreas: ScrollableArea[]): ScrollableArea[] {
    // Remove duplicates based on element reference
    const unique = scrollableAreas.filter((area, index, array) => 
      array.findIndex(other => other.element === area.element) === index
    );
    
    // Sort by total scrollable area (largest first)
    return unique.sort((a, b) => {
      const aArea = a.scrollHeight * a.scrollWidth;
      const bArea = b.scrollHeight * b.scrollWidth;
      return bArea - aArea;
    });
  }
  
  private static mergeConfig(config?: Partial<DOMDetectionConfig>): DOMDetectionConfig {
    return {
      includeHiddenElements: false,
      minScrollableSize: this.DEFAULT_MIN_SIZE,
      maxDepth: 50,
      excludeSelectors: [ElementSelectors.ALL_EXCLUDED],
      ...config
    };
  }
}