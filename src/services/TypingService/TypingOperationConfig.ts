/**
 * Configuration for typing operations
 */
export interface TypingOperationConfig {
  readonly element: HTMLInputElement | HTMLTextAreaElement;
  readonly text: string;
  readonly options: TypingOptions;
  readonly operation: TypingOperationMetadata;
}

/**
 * Options for typing behavior
 */
export interface TypingOptions {
  readonly onProgress?: (currentText: string) => void;
  readonly onComplete?: () => void;
  readonly speedMultiplier?: number;
}

/**
 * Metadata for typing operations
 */
export interface TypingOperationMetadata {
  readonly type: string;
  readonly emptyTextWarning: string;
  readonly errorLogMessage: string;
  readonly errorLogContext: string;
  readonly elementErrorPrefix: string;
  readonly unknownErrorMessage: string;
}

/**
 * Function signature for typing implementations
 */
export type TypingFunction = (
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  options: TypingOptions
) => Promise<void>;
