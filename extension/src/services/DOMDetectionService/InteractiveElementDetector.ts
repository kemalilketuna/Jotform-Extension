import { InteractiveElement, InteractiveElementType } from './DOMDetectionTypes.ts';
import { JSPathGenerator } from './JSPathGenerator.ts';
import { VisibilityDetectionError } from './DOMDetectionErrors.ts';

export class InteractiveElementDetector {
  
  /**
   * Find all visible interactive elements using efficient detection
   */
  static findVisibleInteractiveElements(): InteractiveElement[] {
    try {
      const buttons = this.findVisibleButtons();
      const links = this.findVisibleLinks();
      const inputs = this.findVisibleInputs();
      
      return [...buttons, ...links, ...inputs].sort(this.sortByPosition);
    } catch (error) {
      throw new VisibilityDetectionError(
        document.body,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Find visible buttons using efficient approach
   */
  static findVisibleButtons(): InteractiveElement[] {
    const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    const visibleButtons: InteractiveElement[] = [];

    allButtons.forEach(button => {
       const element = button as HTMLElement;
       const rect = element.getBoundingClientRect();
       const isVisible = (
         rect.top < window.innerHeight &&
         rect.bottom >= 0 &&
         rect.left < window.innerWidth &&
         rect.right >= 0 &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0
       );

       if (isVisible) {
         const type = this.determineButtonType(element);
         visibleButtons.push(this.createInteractiveElement(element, type));
       }
     });

    return visibleButtons;
  }

  /**
   * Find visible links using the same efficient approach
   */
  static findVisibleLinks(): InteractiveElement[] {
    const allLinks = document.querySelectorAll('a[href]');
    const visibleLinks: InteractiveElement[] = [];

    allLinks.forEach(link => {
       const element = link as HTMLElement;
       const rect = element.getBoundingClientRect();
       const isVisible = (
         rect.top < window.innerHeight &&
         rect.bottom >= 0 &&
         rect.left < window.innerWidth &&
         rect.right >= 0 &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0
       );

       if (isVisible) {
         visibleLinks.push(this.createInteractiveElement(element, 'link'));
       }
     });

    return visibleLinks;
  }

  /**
   * Find visible input elements using the same efficient approach
   */
  static findVisibleInputs(): InteractiveElement[] {
    const allInputs = document.querySelectorAll('input:not([type="button"]):not([type="submit"]), textarea, select');
    const visibleInputs: InteractiveElement[] = [];

    allInputs.forEach(input => {
       const element = input as HTMLElement;
       const rect = element.getBoundingClientRect();
       const isVisible = (
         rect.top < window.innerHeight &&
         rect.bottom >= 0 &&
         rect.left < window.innerWidth &&
         rect.right >= 0 &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0
       );

       if (isVisible) {
         const type = this.determineInputType(element);
         visibleInputs.push(this.createInteractiveElement(element, type));
       }
     });

    return visibleInputs;
  }
  
  /**
   * Find interactive elements by type
   */
  static findElementsByType(type: InteractiveElementType): InteractiveElement[] {
    const allElements = this.findVisibleInteractiveElements();
    return allElements.filter(element => element.type === type);
  }
  
  /**
   * Check if an element is visible using the same logic
   */
  static isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom >= 0 &&
      rect.left < window.innerWidth &&
      rect.right >= 0 &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }
  
  /**
   * Create InteractiveElement object from HTMLElement
   */
  private static createInteractiveElement(element: HTMLElement, type: InteractiveElementType): InteractiveElement {
    const rect = element.getBoundingClientRect();
    const attributes: Record<string, string> = {};
    
    // Extract relevant attributes
    const relevantAttrs = ['id', 'class', 'name', 'type', 'role', 'aria-label', 'title', 'href', 'value'];
    relevantAttrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value !== null) {
        attributes[attr] = value;
      }
    });

    return {
      element,
      jsPath: JSPathGenerator.generatePath(element),
      type,
      isVisible: true, // All elements found by this detector are visible
      boundingRect: rect,
      tagName: element.tagName.toLowerCase(),
      attributes
    };
  }
  
  /**
   * Determine button type
   */
  private static determineButtonType(element: HTMLElement): InteractiveElementType {
    const type = element.getAttribute('type')?.toLowerCase();
    if (type === 'submit') return 'submit';
    return 'button';
  }

  /**
   * Determine input type
   */
  private static determineInputType(element: HTMLElement): InteractiveElementType {
    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type')?.toLowerCase();
    
    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'select') return 'select';
    if (tagName === 'input') {
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      return 'input';
    }
    
    return 'input';
  }
  
  /**
   * Sort elements by position (top to bottom, left to right)
   */
  private static sortByPosition = (a: InteractiveElement, b: InteractiveElement): number => {
    const aRect = a.boundingRect;
    const bRect = b.boundingRect;
    
    // Sort by top position first
    if (Math.abs(aRect.top - bRect.top) > 10) {
      return aRect.top - bRect.top;
    }
    
    // If roughly same top position, sort by left position
    return aRect.left - bRect.left;
  };
}