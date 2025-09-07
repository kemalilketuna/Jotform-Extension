import { LoggingService } from '@/services/LoggingService';
import { DOMDetectionService } from '@/services/DOMDetectionService';
import { AutomationError } from './AutomationErrors';

/**
 * Handles DOM analysis and element detection for automation
 */
export class DOMAnalyzer {
  private readonly logger: LoggingService;
  private readonly domDetectionService: DOMDetectionService;
  private readonly domLoadTimeout = 10000; // 10 seconds timeout for DOM loading

  constructor(
    logger: LoggingService,
    domDetectionService: DOMDetectionService
  ) {
    this.logger = logger;
    this.domDetectionService = domDetectionService;
  }

  /**
   * Wait for DOM to be ready and analyze it
   */
  async waitForDOMReady(): Promise<void> {
    try {
      await Promise.race([
        this.domDetectionService.waitForDOMAndAnalyze(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('DOM load timeout')),
            this.domLoadTimeout
          )
        ),
      ]);
    } catch (error) {
      const errorMessage = `DOM loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage, 'DOMAnalyzer');
      throw new AutomationError(errorMessage);
    }
  }

  /**
   * Get visible interactive elements from the page
   */
  async getVisibleInteractiveElements(): Promise<HTMLElement[]> {
    const visibleElements =
      await this.domDetectionService.listVisibleInteractiveElements();

    if (visibleElements.length === 0) {
      const errorMessage = 'No visible interactive elements found on the page';
      this.logger.error(errorMessage, 'DOMAnalyzer');
      throw new AutomationError(errorMessage);
    }

    this.logger.info(
      `Found ${visibleElements.length} visible interactive elements`,
      'DOMAnalyzer'
    );

    return visibleElements;
  }

  /**
   * Convert elements to HTML strings for backend processing
   */
  convertElementsToHTML(elements: HTMLElement[]): string[] {
    return elements.map((element) => {
      try {
        return element.outerHTML;
      } catch (error) {
        this.logger.warn(
          `Failed to get outerHTML for element: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'DOMAnalyzer'
        );
        return '<div>Element HTML unavailable</div>';
      }
    });
  }
}
