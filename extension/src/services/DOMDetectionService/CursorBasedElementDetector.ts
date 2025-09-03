import { DOMDetectionError } from './DOMDetectionErrors.ts';
import { LoggingService } from '@/services/LoggingService';

export class CursorBasedElementDetector {
  private static instance: CursorBasedElementDetector | null = null;
  private readonly logger: LoggingService;

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  /**
   * Gets the singleton instance of CursorBasedElementDetector
   */
  static getInstance(): CursorBasedElementDetector {
    if (!CursorBasedElementDetector.instance) {
      CursorBasedElementDetector.instance = new CursorBasedElementDetector();
    }
    return CursorBasedElementDetector.instance;
  }

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
