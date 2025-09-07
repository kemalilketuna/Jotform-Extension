import { DOMDetectionError } from './DOMDetectionErrors.js';
import { ServiceFactory } from '@/services/DIContainer';
import { LoggingService } from '@/services/LoggingService';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { UserInteractionBlocker } from '@/services/UserInteractionBlocker';
import { SingletonManager } from '@/utils/SingletonService';

export class CursorBasedElementDetector {
  private readonly logger: LoggingService;

  private constructor() {
    const serviceFactory = ServiceFactory.getInstance();
    this.logger = serviceFactory.createLoggingService();
  }

  /**
   * Gets the singleton instance of CursorBasedElementDetector
   */
  static getInstance(): CursorBasedElementDetector {
    return SingletonManager.getInstance(
      'CursorBasedElementDetector',
      () => new CursorBasedElementDetector()
    );
  }

  // Interactive cursor styles that indicate an element is interactive
  private readonly interactiveCursorStyles = [
    'pointer',
    'move',
    'text',
    'grab',
    'grabbing',
    'crosshair',
    'help',
  ] as const;

  // Tags to exclude from interactive element detection
  private readonly excludedTags = [
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

  /**
   * Lists all visible interactive elements on the page based on cursor styles
   * Uses cursor style detection to identify interactive elements
   */
  public listVisibleInteractiveElements(): HTMLElement[] {
    try {
      this.logger.debug(
        'Starting to list visible interactive elements',
        'CursorBasedElementDetector'
      );

      const loggedElements = new Set<HTMLElement>();
      let allElements: NodeListOf<Element>;
      try {
        allElements = document.querySelectorAll('*');
      } catch (error) {
        this.logger.error(
          `Failed to query all elements: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'listVisibleInteractiveElements'
        );
        return [];
      }
      const visibleElements: HTMLElement[] = [];
      let count = 0;
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;

        if (this.shouldExcludeElement(htmlElement)) {
          return;
        }

        if (this.hasInteractiveCursorStyle(htmlElement)) {
          if (this.isElementInViewport(htmlElement)) {
            if (this.isElementTopmost(htmlElement)) {
              count += 1;
              if (!loggedElements.has(htmlElement)) {
                this.logInteractiveElement(htmlElement);
                loggedElements.add(htmlElement);
                visibleElements.push(htmlElement);
              }
            }
          }
        }
      });

      this.logger.warn(
        `Found ${count} interactive elements`,
        'CursorBasedElementDetector'
      );

      this.logger.info(
        `Found ${visibleElements.length} visible interactive elements`,
        'CursorBasedElementDetector'
      );

      return visibleElements;
    } catch (error) {
      this.logger.error(
        `Failed to list visible interactive elements: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CursorBasedElementDetector'
      );
      throw new DOMDetectionError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Checks if an element should be excluded from interactive element detection
   */
  private shouldExcludeElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toUpperCase();

    // Exclude elements with tags in the excluded list
    if (
      this.excludedTags.includes(tagName as (typeof this.excludedTags)[number])
    ) {
      return true;
    }

    // Exclude anchor tags without href attributes
    if (tagName === 'A' && !element.hasAttribute('href')) {
      return true;
    }

    // Exclude extension components
    if (
      element.classList.contains(
        EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS
      ) ||
      element.classList.contains(EXTENSION_COMPONENTS.INTERACTION_BLOCKER_CLASS)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Checks if an element has an interactive cursor style
   */
  private hasInteractiveCursorStyle(element: HTMLElement): boolean {
    const cursorStyle = window.getComputedStyle(element).cursor;
    return this.interactiveCursorStyles.includes(
      cursorStyle as (typeof this.interactiveCursorStyles)[number]
    );
  }

  /**
   * Checks if an element is in the viewport and has non-zero dimensions
   */
  private isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();

    // Check if element has non-zero dimensions
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    // Check if element is in viewport
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Checks if an element is the topmost element at its center point
   * Handles UserInteractionBlocker overlay during automation
   */
  private isElementTopmost(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Get all elements at the point to handle overlays safely
    const elementsAtPoint = document.elementsFromPoint(x, y);

    // Filter out the UserInteractionBlocker overlay if present
    const userBlocker = UserInteractionBlocker.getInstance();
    const filteredElements = elementsAtPoint.filter(
      (el) =>
        !(
          el.classList.contains(
            EXTENSION_COMPONENTS.INTERACTION_BLOCKER_CLASS
          ) && userBlocker.isActive
        )
    );

    // Get the topmost non-blocker element
    const topElement = filteredElements.length > 0 ? filteredElements[0] : null;

    return (
      topElement !== null &&
      (topElement === element || element.contains(topElement))
    );
  }

  /**
   * Logs information about an interactive element
   */
  private logInteractiveElement(element: HTMLElement): void {
    const tagName = element.tagName.toUpperCase();
    const cursorStyle = window.getComputedStyle(element).cursor;
    const rect = element.getBoundingClientRect();

    this.logger.debug(
      `Found visible interactive element: ${tagName}`,
      'CursorBasedElementDetector',
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
  }

  /**
   * Check if an element is visible
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
    } catch {
      return false;
    }
  }
}
