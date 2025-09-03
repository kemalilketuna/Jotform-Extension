import { ScrollableArea, DOMDetectionConfig } from './DOMDetectionTypes.ts';
import { DOMDetectionError } from './DOMDetectionErrors.ts';
import { ScrollableAreaDetector } from './ScrollableAreaDetector.ts';
import { CursorBasedElementDetector } from './CursorBasedElementDetector.ts';
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
      return CursorBasedElementDetector.getInstance().isElementVisible(element);
    } catch {
      return false;
    }
  }

  /**
   * Gets comprehensive information about the current page's DOM structure
   */
  getPageAnalysis(): {
    scrollableAreas: ScrollableArea[];
    summary: {
      totalScrollableAreas: number;
    };
  } {
    try {
      const scrollableAreas = this.findScrollableAreas();

      return {
        scrollableAreas,
        summary: {
          totalScrollableAreas: scrollableAreas.length,
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
    interactiveElements: HTMLElement[];
  }> {
    return new Promise((resolve, reject) => {
      const performAnalysis = () => {
        try {
          const scrollableAreas = this.findScrollableAreas();
          const interactiveElements = this.listVisibleInteractiveElements();

          resolve({
            scrollableAreas,
            interactiveElements,
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
      return CursorBasedElementDetector.getInstance().listVisibleInteractiveElements();
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
