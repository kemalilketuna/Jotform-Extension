import { ScrollableArea } from './DOMDetectionTypes.js';
import { JSPathGenerator } from './JSPathGenerator.js';
import { ScrollDetectionError } from './DOMDetectionErrors.js';

export class ScrollableAreaDetector {
  private pathGenerator: JSPathGenerator;

  constructor() {
    this.pathGenerator = new JSPathGenerator();
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
    } catch {
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
      jsPath: JSPathGenerator.generatePath(element),
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      isVerticallyScrollable,
      isHorizontallyScrollable,
    };
  }
}
