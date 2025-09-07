import { VisibilityDetectionError } from './DOMDetectionErrors.js';
import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { SingletonManager } from '@/utils/SingletonService';

export class ElementVisibility {
  private readonly logger: LoggingService;

  private constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
  }

  /**
   * Gets the singleton instance of ElementVisibilityService
   */
  static getInstance(): ElementVisibility {
    return SingletonManager.getInstance(
      'ElementVisibility',
      () => new ElementVisibility()
    );
  }

  /**
   * Check if an element is visible in the viewport
   */
  public isElementVisible(element: HTMLElement): boolean {
    try {
      const rect = element.getBoundingClientRect();
      return (
        rect.top < window.innerHeight &&
        rect.bottom >= 0 &&
        rect.left < window.innerWidth &&
        rect.right >= 0 &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0
      );
    } catch (error) {
      this.logger.warn(
        'Failed to check element visibility:',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * Check if an element is visible and not obscured by other elements
   */
  public isElementFullyVisible(element: HTMLElement): boolean {
    try {
      if (!this.isElementVisible(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const topElement = document.elementFromPoint(x, y);

      return (
        topElement !== null &&
        (topElement === element || element.contains(topElement))
      );
    } catch (error) {
      this.logger.warn(
        'Failed to check if element is fully visible:',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * Get all visible elements matching a selector
   */
  public getVisibleElements(selector: string): HTMLElement[] {
    try {
      const elements = Array.from(
        document.querySelectorAll(selector)
      ) as HTMLElement[];
      return elements.filter((element) => this.isElementVisible(element));
    } catch (error) {
      this.logger.error(
        `Failed to get visible elements for selector ${selector}:`,
        error instanceof Error ? error.message : String(error)
      );
      throw new VisibilityDetectionError(
        document.body,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
