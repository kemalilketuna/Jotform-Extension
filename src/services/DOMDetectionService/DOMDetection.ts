import { ScrollableArea, DOMDetectionConfig } from './DOMDetectionTypes.js';
import { DOMDetectionError } from './DOMDetectionErrors.js';
import { JSPathGenerator } from './JSPathGenerator.js';
import { ElementVisibility } from './ElementVisibility.js';
import { PageAnalysis } from './PageAnalysis.js';
import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { SingletonManager } from '@/utils/SingletonService';

export class DOMDetection {
  private config: DOMDetectionConfig;
  private readonly logger: LoggingService;
  private readonly pageAnalysisService: PageAnalysis;
  private readonly elementVisibilityService: ElementVisibility;

  private constructor(config?: Partial<DOMDetectionConfig>) {
    this.config = this.mergeDefaultConfig(config);
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
    this.pageAnalysisService = PageAnalysis.getInstance(config);
    this.elementVisibilityService = ElementVisibility.getInstance();
  }

  /**
   * Gets the singleton instance of DOMDetectionService
   */
  static getInstance(config?: Partial<DOMDetectionConfig>): DOMDetection {
    return SingletonManager.getInstance(
      'DOMDetection',
      () => new DOMDetection(config)
    );
  }

  /**
   * Updates the service configuration for all services
   */
  updateConfig(config: Partial<DOMDetectionConfig>): void {
    this.config = { ...this.config, ...config };
    this.pageAnalysisService.updateConfig(config);
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
    return this.pageAnalysisService.findScrollableAreas();
  }

  /**
   * Generates JavaScript path for a specific element
   */
  generateElementPath(element: HTMLElement): string {
    try {
      return JSPathGenerator.generatePath(element);
    } catch (error) {
      this.logger.error(
        `Failed to generate path for element: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'generateElementPath',
        { elementTag: element.tagName.toLowerCase() }
      );
      throw new DOMDetectionError(
        `Failed to generate path for element: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generates multiple JavaScript paths for a specific element
   */
  generateMultiplePaths(element: HTMLElement): string[] {
    try {
      return JSPathGenerator.generateMultiplePaths(element);
    } catch (error) {
      this.logger.error(
        `Failed to generate multiple paths for element: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'generateMultiplePaths',
        { elementTag: element.tagName.toLowerCase() }
      );
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
      // Delegate to PageAnalysisService which has access to ScrollableAreaDetector
      const scrollInfo = this.pageAnalysisService.getScrollInfo(element);
      return scrollInfo !== null;
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
    return this.elementVisibilityService.isElementVisible(element);
  }

  /**
   * Check if an element is fully visible (not obscured by other elements)
   */
  public isElementFullyVisible(element: HTMLElement): boolean {
    return this.elementVisibilityService.isElementFullyVisible(element);
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
    return this.pageAnalysisService.getPageAnalysis();
  }

  /**
   * Waits for DOM to be ready and then performs analysis
   */
  async waitForDOMAndAnalyze(): Promise<{
    scrollableAreas: ScrollableArea[];
    interactiveElements: HTMLElement[];
  }> {
    return this.pageAnalysisService.waitForDOMAndAnalyze();
  }

  /**
   * Lists all visible interactive elements on the page based on cursor styles
   * Uses cursor style detection to identify interactive elements
   */
  public async listVisibleInteractiveElements(): Promise<HTMLElement[]> {
    try {
      // This method is still using CursorBasedElementDetector through PageAnalysisService
      const { interactiveElements } =
        await this.pageAnalysisService.getInteractiveElements();
      return interactiveElements;
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
