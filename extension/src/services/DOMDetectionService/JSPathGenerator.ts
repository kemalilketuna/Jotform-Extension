import { JSPathGenerationError } from './DOMDetectionErrors.ts';

export class JSPathGenerator {
  private static readonly MAX_DEPTH = 50;
  private static readonly DOCUMENT_SELECTOR = 'document';
  private static readonly QUERY_SELECTOR = 'querySelector';
  private static readonly QUERY_SELECTOR_ALL = 'querySelectorAll';
  
  /**
   * Generates a JavaScript path to access the given element
   */
  static generatePath(element: HTMLElement): string {
    try {
      if (!element || !element.ownerDocument) {
        throw new JSPathGenerationError(element, 'Invalid element or no owner document');
      }
      
      // Try ID-based path first (most reliable)
      const idPath = this.generateIdPath(element);
      if (idPath) {
        return idPath;
      }
      
      // Try unique selector path
      const selectorPath = this.generateSelectorPath(element);
      if (selectorPath) {
        return `${this.DOCUMENT_SELECTOR}.${this.QUERY_SELECTOR}('${selectorPath}')`;
      }
      
      // Fallback to xpath-like path
      return this.generateXPathLikePath(element);
      
    } catch (error) {
      throw new JSPathGenerationError(element, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Generates multiple possible paths for redundancy
   */
  static generateMultiplePaths(element: HTMLElement): string[] {
    const paths: string[] = [];
    
    try {
      const idPath = this.generateIdPath(element);
      if (idPath) paths.push(idPath);
      
      const selectorPath = this.generateSelectorPath(element);
      if (selectorPath) {
        paths.push(`${this.DOCUMENT_SELECTOR}.${this.QUERY_SELECTOR}('${selectorPath}')`);
      }
      
      const xpathPath = this.generateXPathLikePath(element);
      if (xpathPath) paths.push(xpathPath);
      
    } catch (error) {
      // Return at least one path even if others fail
      if (paths.length === 0) {
        paths.push(this.generateFallbackPath(element));
      }
    }
    
    return paths;
  }
  
  private static generateIdPath(element: HTMLElement): string | null {
    if (element.id && this.isValidId(element.id)) {
      return `${this.DOCUMENT_SELECTOR}.getElementById('${this.escapeSelector(element.id)}')`;
    }
    return null;
  }
  
  private static generateSelectorPath(element: HTMLElement): string | null {
    const selectors: string[] = [];
    let currentElement: Element | null = element;
    let depth = 0;
    
    while (currentElement && currentElement !== document.documentElement && depth < this.MAX_DEPTH) {
      const selector = this.getElementSelector(currentElement as HTMLElement);
      if (selector) {
        selectors.unshift(selector);
        
        // Test if current path is unique
        const testPath = selectors.join(' > ');
        if (document.querySelectorAll(testPath).length === 1) {
          return testPath;
        }
      }
      
      currentElement = currentElement.parentElement;
      depth++;
    }
    
    return selectors.length > 0 ? selectors.join(' > ') : null;
  }
  
  private static generateXPathLikePath(element: HTMLElement): string {
    const path: string[] = [];
    let currentElement: Element | null = element;
    let depth = 0;
    
    while (currentElement && currentElement !== document.documentElement && depth < this.MAX_DEPTH) {
      const tagName = currentElement.tagName.toLowerCase();
      const index = this.getElementIndex(currentElement);
      
      if (index > 0) {
        path.unshift(`${tagName}:nth-of-type(${index})`);
      } else {
        path.unshift(tagName);
      }
      
      currentElement = currentElement.parentElement;
      depth++;
    }
    
    const selector = path.join(' > ');
    return `${this.DOCUMENT_SELECTOR}.${this.QUERY_SELECTOR}('${selector}')`;
  }
  
  private static getElementSelector(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    
    // Use ID if available and valid
    if (element.id && this.isValidId(element.id)) {
      return `${tagName}#${this.escapeSelector(element.id)}`;
    }
    
    // Use class if available and specific enough
    if (element.className) {
      const classes = element.className.trim().split(/\s+/)
        .filter(cls => cls && this.isValidClass(cls))
        .map(cls => this.escapeSelector(cls))
        .join('.');
      
      if (classes) {
        const selector = `${tagName}.${classes}`;
        if (document.querySelectorAll(selector).length <= 3) {
          return selector;
        }
      }
    }
    
    // Use nth-of-type as fallback
    const index = this.getElementIndex(element);
    return index > 0 ? `${tagName}:nth-of-type(${index})` : tagName;
  }
  
  private static getElementIndex(element: Element): number {
    const siblings = Array.from(element.parentElement?.children || []);
    const sameTagSiblings = siblings.filter(sibling => 
      sibling.tagName === element.tagName
    );
    
    return sameTagSiblings.indexOf(element) + 1;
  }
  
  private static isValidId(id: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id);
  }
  
  private static isValidClass(className: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(className);
  }
  
  private static escapeSelector(selector: string): string {
    return selector.replace(/["'\\]/g, '\\$&');
  }
  
  private static generateFallbackPath(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const index = this.getElementIndex(element);
    return `${this.DOCUMENT_SELECTOR}.${this.QUERY_SELECTOR}('${tagName}:nth-of-type(${index})')`;
  }
}