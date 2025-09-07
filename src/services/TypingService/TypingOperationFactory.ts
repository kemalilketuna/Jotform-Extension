import { TypingOperationMetadata } from './TypingOperationConfig';

/**
 * Factory for creating typing operation metadata configurations
 */
export class TypingOperationFactory {
  /**
   * Create metadata for basic typing simulation
   */
  static createBasicTypingOperation(): TypingOperationMetadata {
    return {
      type: 'typing simulation',
      emptyTextWarning: 'Empty text provided for typing simulation',
      errorLogMessage: 'Failed to simulate typing',
      errorLogContext: 'TypingService.simulateTyping',
      elementErrorPrefix: 'Typing simulation failed',
      unknownErrorMessage: 'Unknown error during typing simulation',
    };
  }

  /**
   * Create metadata for realistic typing simulation
   */
  static createRealisticTypingOperation(): TypingOperationMetadata {
    return {
      type: 'realistic typing simulation',
      emptyTextWarning: 'Empty text provided for realistic typing simulation',
      errorLogMessage: 'Failed to simulate realistic typing',
      errorLogContext: 'TypingService.simulateRealisticTyping',
      elementErrorPrefix: 'Realistic typing simulation failed',
      unknownErrorMessage: 'Unknown error during realistic typing simulation',
    };
  }

  /**
   * Create custom operation metadata
   */
  static createCustomOperation(
    type: string,
    contextPrefix: string
  ): TypingOperationMetadata {
    return {
      type,
      emptyTextWarning: `Empty text provided for ${type}`,
      errorLogMessage: `Failed to execute ${type}`,
      errorLogContext: `TypingService.${contextPrefix}`,
      elementErrorPrefix: `${type} failed`,
      unknownErrorMessage: `Unknown error during ${type}`,
    };
  }
}
