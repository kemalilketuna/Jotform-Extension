import { ScrollableArea, DOMDetectionConfig } from './DOMDetectionTypes.ts';
import { DOMDetectionError } from './DOMDetectionErrors.ts';
import { ScrollableAreaDetector } from './ScrollableAreaDetector.ts';
import { CursorBasedElementDetector } from './CursorBasedElementDetector.ts';
import { LoggingService } from '@/services/LoggingService';

export class PageAnalysis {
  private static instance: PageAnalysis | null = null;
  private config: DOMDetectionConfig;
  private scrollableDetector: ScrollableAreaDetector;
  private cursorDetector: CursorBasedElementDetector;
  private readonly logger: LoggingService;

  private constructor(config?: Partial<DOMDetectionConfig>) {
    this.config = this.mergeDefaultConfig(config);
    this.scrollableDetector = new ScrollableAreaDetector();
    this.cursorDetector = CursorBasedElementDetector.getInstance();
    this.logger = LoggingService.getInstance();
  }

  /**
   * Gets the singleton instance of PageAnalysisService
   */
  static getInstance(config?: Partial<DOMDetectionConfig>): PageAnalysis {
    if (!PageAnalysis.instance) {
      PageAnalysis.instance = new PageAnalysis(config);
    }
    return PageAnalysis.instance;
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
   * Get scroll information for a specific element
   */
  public getScrollInfo(element: HTMLElement): ScrollableArea | null {
    try {
      return this.scrollableDetector.getScrollInfo(element);
    } catch (error) {
      this.logger.warn(
        'Failed to get scroll info:',
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Gets all interactive elements on the page
   */
  public getInteractiveElements(): { interactiveElements: HTMLElement[] } {
    try {
      const interactiveElements =
        this.cursorDetector.listVisibleInteractiveElements();
      return { interactiveElements };
    } catch (error) {
      this.logger.error(
        'Failed to find interactive elements:',
        error instanceof Error ? error.message : String(error)
      );
      return { interactiveElements: [] };
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
          const { interactiveElements } = this.getInteractiveElements();

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
