import { LoggingService } from '../LoggingService';
import { UIConfig } from '@/config/UIConfig';
import { ErrorHandlingConfig } from '@/utils/ErrorHandlingUtils';

/**
 * Manages DOM container creation and cleanup for React components
 */
export class DOMContainerManager {
  private readonly logger: LoggingService;
  private containerElement: HTMLElement | null = null;

  constructor(logger: LoggingService) {
    this.logger = logger;
  }

  /**
   * Create the container element for React components
   */
  createContainer(): HTMLElement {
    try {
      // Remove existing container if it exists
      this.removeContainer();

      // Create the container element
      this.containerElement = document.createElement('div');
      this.containerElement.id = 'jotform-extension-components';

      // Set container styles to ensure proper positioning
      this.containerElement.style.position = 'fixed';
      this.containerElement.style.top = '0';
      this.containerElement.style.left = '0';
      this.containerElement.style.width = '100%';
      this.containerElement.style.height = '100%';
      this.containerElement.style.pointerEvents = 'none';
      this.containerElement.style.zIndex =
        UIConfig.Z_INDEX.EXTENSION_BASE.toString();

      // Add to document body
      document.body.appendChild(this.containerElement);

      this.logger.info(
        'Component container created and added to page',
        'DOMContainerManager'
      );

      return this.containerElement;
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'DOMContainerManager.createContainer',
        operation: 'create component container',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Remove the component container from the page
   */
  removeContainer(): void {
    try {
      // Remove container element
      if (this.containerElement && this.containerElement.parentNode) {
        this.containerElement.parentNode.removeChild(this.containerElement);
        this.containerElement = null;
        this.logger.info(
          'Component container removed from page',
          'DOMContainerManager'
        );
      }

      // Also remove any existing containers by ID
      const existingContainer = document.getElementById(
        'jotform-extension-components'
      );
      if (existingContainer && existingContainer.parentNode) {
        existingContainer.parentNode.removeChild(existingContainer);
      }
    } catch (error) {
      const config: ErrorHandlingConfig = {
        context: 'DOMContainerManager.removeContainer',
        operation: 'remove component container',
      };
      const errorMessage = `${config.operation} failed: ${String(error)}`;
      this.logger.error(errorMessage, config.context, {
        error: String(error),
      });
    }
  }

  /**
   * Get the current container element
   */
  getContainer(): HTMLElement | null {
    return this.containerElement;
  }

  /**
   * Check if container exists and is attached to DOM
   */
  isContainerActive(): boolean {
    return (
      this.containerElement !== null &&
      this.containerElement.parentNode !== null
    );
  }
}
