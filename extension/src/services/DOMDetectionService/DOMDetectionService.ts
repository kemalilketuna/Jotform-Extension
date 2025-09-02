import {
  ScrollableArea,
  InteractiveElement,
  DOMDetectionConfig,
  InteractiveElementType,
} from './DOMDetectionTypes.ts';
import { DOMDetectionError } from './DOMDetectionErrors.ts';
import { ScrollableAreaDetector } from './ScrollableAreaDetector.ts';
import { InteractiveElementDetector } from './InteractiveElementDetector.ts';
import { JSPathGenerator } from './JSPathGenerator.ts';

export class DOMDetectionService {
  private static instance: DOMDetectionService | null = null;
  private config: DOMDetectionConfig;
  private scrollableDetector: ScrollableAreaDetector;

  private constructor(config?: Partial<DOMDetectionConfig>) {
    this.config = this.mergeDefaultConfig(config);
    this.scrollableDetector = new ScrollableAreaDetector();
  }

  /**
   * Gets the singleton instance of DOMDetectionService
   */
  static getInstance(
    config?: Partial<DOMDetectionConfig>
  ): DOMDetectionService {
    if (!DOMDetectionService.instance) {
      DOMDetectionService.instance = new DOMDetectionService(config);
    }
    return DOMDetectionService.instance;
  }

  /**
   * Updates the service configuration
   */
  updateConfig(config: Partial<DOMDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): DOMDetectionConfig {
    return { ...this.config };
  }

  /**
   * Find all scrollable areas in the current page
   */
  public findScrollableAreas(): ScrollableArea[] {
    try {
      return this.scrollableDetector.findScrollableAreas();
    } catch (error) {
      console.error('Failed to find scrollable areas:', error);
      return [];
    }
  }

  /**
   * Find all visible interactive elements in the document
   */
  public findInteractiveElements(): InteractiveElement[] {
    try {
      return InteractiveElementDetector.findVisibleInteractiveElements();
    } catch (error) {
      throw new DOMDetectionError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Find only visible interactive elements
   */
  public findVisibleInteractiveElements(): InteractiveElement[] {
    try {
      return InteractiveElementDetector.findVisibleInteractiveElements();
    } catch (error) {
      throw new DOMDetectionError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Find interactive elements by type
   */
  public findElementsByType(
    type: InteractiveElementType
  ): InteractiveElement[] {
    try {
      return InteractiveElementDetector.findElementsByType(type);
    } catch (error) {
      throw new DOMDetectionError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Find visible buttons
   */
  public findVisibleButtons(): InteractiveElement[] {
    try {
      return InteractiveElementDetector.findVisibleButtons();
    } catch (error) {
      throw new DOMDetectionError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Find visible links
   */
  public findVisibleLinks(): InteractiveElement[] {
    try {
      return InteractiveElementDetector.findVisibleLinks();
    } catch (error) {
      throw new DOMDetectionError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Find visible inputs
   */
  public findVisibleInputs(): InteractiveElement[] {
    try {
      return InteractiveElementDetector.findVisibleInputs();
    } catch (error) {
      throw new DOMDetectionError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Generates JavaScript path for a specific element
   */
  generateElementPath(element: HTMLElement): string {
    try {
      return JSPathGenerator.generatePath(element);
    } catch (error) {
      throw new DOMDetectionError(
        `Failed to generate path for element: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generates multiple JavaScript paths for redundancy
   */
  generateMultiplePaths(element: HTMLElement): string[] {
    try {
      return JSPathGenerator.generateMultiplePaths(element);
    } catch (error) {
      throw new DOMDetectionError(
        `Failed to generate multiple paths for element: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Checks if an element is currently scrollable
   */
  isElementScrollable(element: HTMLElement): boolean {
    try {
      return this.scrollableDetector.isElementScrollable(element);
    } catch (error) {
      console.warn('Failed to check if element is scrollable:', error);
      return false;
    }
  }

  /**
   * Check if an element is visible
   */
  public isElementVisible(element: HTMLElement): boolean {
    try {
      return InteractiveElementDetector.isElementVisible(element);
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets comprehensive information about the current page's DOM structure
   */
  getPageAnalysis(): {
    scrollableAreas: ScrollableArea[];
    interactiveElements: InteractiveElement[];
    visibleElements: InteractiveElement[];
    buttons: InteractiveElement[];
    inputs: InteractiveElement[];
    links: InteractiveElement[];
    summary: {
      totalScrollableAreas: number;
      totalInteractiveElements: number;
      visibleInteractiveElements: number;
      totalButtons: number;
      totalInputs: number;
      totalLinks: number;
    };
  } {
    try {
      const scrollableAreas = this.findScrollableAreas();
      const interactiveElements = this.findInteractiveElements();
      const visibleElements = this.findVisibleInteractiveElements();
      const buttons = this.findVisibleButtons();
      const inputs = this.findVisibleInputs();
      const links = this.findVisibleLinks();

      return {
        scrollableAreas,
        interactiveElements,
        visibleElements,
        buttons,
        inputs,
        links,
        summary: {
          totalScrollableAreas: scrollableAreas.length,
          totalInteractiveElements: interactiveElements.length,
          visibleInteractiveElements: visibleElements.length,
          totalButtons: buttons.length,
          totalInputs: inputs.length,
          totalLinks: links.length,
        },
      };
    } catch (error) {
      throw new DOMDetectionError(
        `Failed to analyze page: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Waits for DOM to be ready and then performs analysis
   */
  async waitForDOMAndAnalyze(): Promise<{
    scrollableAreas: ScrollableArea[];
    interactiveElements: InteractiveElement[];
    visibleElements: InteractiveElement[];
  }> {
    return new Promise((resolve, reject) => {
      const performAnalysis = () => {
        try {
          const scrollableAreas = this.findScrollableAreas();
          const interactiveElements = this.findInteractiveElements();
          const visibleElements = this.findVisibleInteractiveElements();

          resolve({
            scrollableAreas,
            interactiveElements,
            visibleElements,
          });
        } catch (error) {
          reject(
            new DOMDetectionError(
              `Failed to analyze DOM: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', performAnalysis, {
          once: true,
        });
      } else {
        // DOM is already ready, perform analysis after a short delay to ensure all elements are rendered
        setTimeout(performAnalysis, 100);
      }
    });
  }

  private mergeDefaultConfig(
    config?: Partial<DOMDetectionConfig>
  ): DOMDetectionConfig {
    return {
      includeHiddenElements: false,
      minScrollableSize: 50,
      maxDepth: 50,
      excludeSelectors: [
        'script',
        'style',
        'noscript',
        'meta',
        'link[rel]',
        'title',
        '[data-extension]',
        '[class*="extension"]',
      ],
      ...config,
    };
  }
}
