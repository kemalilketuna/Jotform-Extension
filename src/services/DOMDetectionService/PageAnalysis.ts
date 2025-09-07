import { ScrollableArea, DOMDetectionConfig } from './DOMDetectionTypes.js';
import { DOMDetectionError } from './DOMDetectionErrors.js';
import { ScrollableAreaDetector } from './ScrollableAreaDetector.js';
import { CursorBasedElementDetector } from './CursorBasedElementDetector.js';
import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import {
  ErrorHandlingUtils,
  ErrorHandlingConfig,
} from '@/utils/ErrorHandlingUtils';

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
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
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
  public async findScrollableAreas(): Promise<ScrollableArea[]> {
    const config: ErrorHandlingConfig = {
      context: 'PageAnalysis',
      operation: 'findScrollableAreas',
      logLevel: 'warn',
    };

    return ErrorHandlingUtils.safeExecute(
      async () => this.scrollableDetector.findScrollableAreas(),
      [],
      config,
      this.logger
    );
  }

  /**
   * Get scroll information for a specific element
   */
  public async getScrollInfo(
    element: HTMLElement
  ): Promise<ScrollableArea | null> {
    const config: ErrorHandlingConfig = {
      context: 'PageAnalysis',
      operation: 'getScrollInfo',
      logLevel: 'warn',
    };

    ErrorHandlingUtils.validateRequired(
      element,
      'element',
      'PageAnalysis',
      this.logger
    );

    return ErrorHandlingUtils.safeExecute(
      async () => this.scrollableDetector.getScrollInfo(element),
      null,
      config,
      this.logger
    );
  }

  /**
   * Gets all interactive elements on the page
   */
  public async getInteractiveElements(): Promise<{
    interactiveElements: HTMLElement[];
  }> {
    const config: ErrorHandlingConfig = {
      context: 'PageAnalysis',
      operation: 'getInteractiveElements',
      logLevel: 'error',
    };

    const interactiveElements = await ErrorHandlingUtils.safeExecute(
      async () => this.cursorDetector.listVisibleInteractiveElements(),
      [],
      config,
      this.logger
    );

    return { interactiveElements };
  }

  /**
   * Gets comprehensive information about the current page's DOM structure
   */
  async getPageAnalysis(): Promise<{
    scrollableAreas: ScrollableArea[];
    summary: {
      totalScrollableAreas: number;
    };
  }> {
    const config: ErrorHandlingConfig = {
      context: 'PageAnalysis',
      operation: 'getPageAnalysis',
    };

    return ErrorHandlingUtils.executeWithTransform(
      async () => {
        const scrollableAreas = await this.findScrollableAreas();

        return {
          scrollableAreas,
          summary: {
            totalScrollableAreas: scrollableAreas.length,
          },
        };
      },
      config,
      this.logger,
      (error) =>
        new DOMDetectionError(`Failed to analyze page: ${error.message}`)
    );
  }

  /**
   * Waits for DOM to be ready and then performs analysis
   */
  async waitForDOMAndAnalyze(): Promise<{
    scrollableAreas: ScrollableArea[];
    interactiveElements: HTMLElement[];
  }> {
    const config: ErrorHandlingConfig = {
      context: 'PageAnalysis',
      operation: 'waitForDOMAndAnalyze',
    };

    return ErrorHandlingUtils.executeWithTransform(
      async () => {
        return new Promise<{
          scrollableAreas: ScrollableArea[];
          interactiveElements: HTMLElement[];
        }>((resolve, reject) => {
          const performAnalysis = async () => {
            try {
              const scrollableAreas = await this.findScrollableAreas();
              const { interactiveElements } =
                await this.getInteractiveElements();

              resolve({
                scrollableAreas,
                interactiveElements,
              });
            } catch (error) {
              reject(error);
            }
          };

          if (document.readyState === 'loading') {
            document.addEventListener(
              'DOMContentLoaded',
              () => performAnalysis().catch(reject),
              {
                once: true,
              }
            );
          } else {
            // DOM is already ready, perform analysis after a short delay to ensure all elements are rendered
            setTimeout(() => performAnalysis().catch(reject), 100);
          }
        });
      },
      config,
      this.logger,
      (error) =>
        new DOMDetectionError(`Failed to analyze DOM: ${error.message}`)
    );
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
