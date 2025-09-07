import { ScrollableArea } from './DOMDetectionTypes.js';
import { JSPathGenerator } from './JSPathGenerator.js';
import { ScrollDetectionError } from './DOMDetectionErrors.js';
import { ErrorHandlingConfig } from '../../utils/ErrorHandlingUtils';
import { LoggingService } from '@/services/LoggingService';

export class ScrollableAreaDetector {
  private pathGenerator: JSPathGenerator;
  private logger?: LoggingService;

  constructor(logger?: LoggingService) {
    this.pathGenerator = new JSPathGenerator();
    this.logger = logger;
  }

  /**
   * Find all scrollable areas in the document using simple and efficient detection
   */
  public findScrollableAreas(): ScrollableArea[] {
    try {
      const scrollableElements = [...document.querySelectorAll('*')].filter(
        (el) => {
          const style = getComputedStyle(el);
          const canScrollY =
            el.scrollHeight > el.clientHeight &&
            /(auto|scroll)/.test(style.overflowY);
          const canScrollX =
            el.scrollWidth > el.clientWidth &&
            /(auto|scroll)/.test(style.overflowX);
          return canScrollX || canScrollY;
        }
      ) as HTMLElement[];

      return scrollableElements.map((element) =>
        this.createScrollableArea(element)
      );
    } catch (error) {
      if (this.logger) {
        const config: ErrorHandlingConfig = {
          context: 'ScrollableAreaDetector',
          operation: 'findScrollableAreas',
        };
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Scrollable area detection failed: ${errorMessage}`,
          config.context
        );
      }

      throw new ScrollDetectionError(
        document.body,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Check if a specific element is scrollable
   */
  public isElementScrollable(element: HTMLElement): boolean {
    try {
      const style = getComputedStyle(element);
      const canScrollY =
        element.scrollHeight > element.clientHeight &&
        /(auto|scroll)/.test(style.overflowY);
      const canScrollX =
        element.scrollWidth > element.clientWidth &&
        /(auto|scroll)/.test(style.overflowX);
      return canScrollX || canScrollY;
    } catch (error) {
      if (this.logger) {
        const config: ErrorHandlingConfig = {
          context: 'ScrollableAreaDetector',
          operation: 'isElementScrollable',
        };
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Element scrollability check failed for ${element.tagName}: ${errorMessage}`,
          config.context
        );
      }
      return false;
    }
  }

  /**
   * Get scroll information for a specific element
   */
  public getScrollInfo(element: HTMLElement): ScrollableArea | null {
    if (!this.isElementScrollable(element)) {
      return null;
    }

    try {
      return this.createScrollableArea(element);
    } catch (error) {
      if (this.logger) {
        const config: ErrorHandlingConfig = {
          context: 'ScrollableAreaDetector',
          operation: 'getScrollInfo',
        };
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Scroll info retrieval failed for ${element.tagName}: ${errorMessage}`,
          config.context
        );
      }

      throw new ScrollDetectionError(
        element,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Create ScrollableArea object from element
   */
  private createScrollableArea(element: HTMLElement): ScrollableArea {
    const style = getComputedStyle(element);

    const isVerticallyScrollable =
      element.scrollHeight > element.clientHeight &&
      /(auto|scroll)/.test(style.overflowY);
    const isHorizontallyScrollable =
      element.scrollWidth > element.clientWidth &&
      /(auto|scroll)/.test(style.overflowX);

    return {
      element,
      jsPath: JSPathGenerator.generatePath(element, this.logger),
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      isVerticallyScrollable,
      isHorizontallyScrollable,
    };
  }
}
