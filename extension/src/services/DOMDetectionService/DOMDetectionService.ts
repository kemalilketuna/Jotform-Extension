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
import { LoggingService } from '@/services/LoggingService';

export class DOMDetectionService {
  private static instance: DOMDetectionService | null = null;
  private config: DOMDetectionConfig;
  private scrollableDetector: ScrollableAreaDetector;
  private readonly logger: LoggingService;

  private constructor(config?: Partial<DOMDetectionConfig>) {
    this.config = this.mergeDefaultConfig(config);
    this.scrollableDetector = new ScrollableAreaDetector();
    this.logger = LoggingService.getInstance();
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
      this.logger.error(
        'Failed to find scrollable areas:',
        error instanceof Error ? error.message : String(error)
      );
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
      this.logger.warn(
        'Failed to check if element is scrollable:',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * Check if an element is visible
   */
  public isElementVisible(element: HTMLElement): boolean {
    try {
      return InteractiveElementDetector.isElementVisible(element);
    } catch {
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

  /**
   * Lists all visible interactive elements on the page based on cursor styles
   * Uses cursor style detection to identify interactive elements
   */
  public listVisibleInteractiveElements(): HTMLElement[] {
    try {
      this.logger.debug(
        'Starting to list visible interactive elements',
        'DOMDetectionService'
      );

      const loggedElements = new Set<HTMLElement>();
      const interactiveCursorStyles = [
        'pointer',
        'move',
        'text',
        'grab',
        'grabbing',
        'crosshair',
        'help',
      ] as const;
      const excludedTags = [
        'H1',
        'H2',
        'H3',
        'H4',
        'H5',
        'H6',
        'SVG',
        'PATH',
        'IMG',
      ] as const;

      const allElements = document.querySelectorAll('*');
      const visibleElements: HTMLElement[] = [];

      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const tagName = htmlElement.tagName.toUpperCase();

        // Exclusion Logic
        if (excludedTags.includes(tagName as (typeof excludedTags)[number])) {
          return;
        }

        if (tagName === 'A' && !htmlElement.hasAttribute('href')) {
          return;
        }

        // Interactivity and Visibility Logic
        const cursorStyle = window.getComputedStyle(htmlElement).cursor;

        if (
          interactiveCursorStyles.includes(
            cursorStyle as (typeof interactiveCursorStyles)[number]
          )
        ) {
          const rect = htmlElement.getBoundingClientRect();

          if (rect.width > 0 && rect.height > 0) {
            const isInViewport =
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <=
                (window.innerHeight || document.documentElement.clientHeight) &&
              rect.right <=
                (window.innerWidth || document.documentElement.clientWidth);

            if (isInViewport) {
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              const topElement = document.elementFromPoint(x, y);

              if (
                topElement &&
                (topElement === htmlElement || htmlElement.contains(topElement))
              ) {
                if (!loggedElements.has(htmlElement)) {
                  this.logger.debug(
                    `Found visible interactive element: ${tagName}`,
                    'DOMDetectionService',
                    {
                      tagName,
                      cursorStyle,
                      rect: {
                        width: rect.width,
                        height: rect.height,
                        x: rect.left,
                        y: rect.top,
                      },
                    }
                  );
                  loggedElements.add(htmlElement);
                  visibleElements.push(htmlElement);
                }
              }
            }
          }
        }
      });

      this.logger.info(
        `Found ${visibleElements.length} visible interactive elements`,
        'DOMDetectionService'
      );

      return visibleElements;
    } catch (error) {
      this.logger.error(
        `Failed to list visible interactive elements: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DOMDetectionService'
      );
      throw new DOMDetectionError(
        error instanceof Error ? error.message : String(error)
      );
    }
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
