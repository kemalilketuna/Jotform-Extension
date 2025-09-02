export class DOMDetectionError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DOMDetectionError';
  }
}

export class ElementNotFoundError extends DOMDetectionError {
  constructor(selector: string) {
    super(`Element not found: ${selector}`);
    this.name = 'ElementNotFoundError';
  }
}

export class JSPathGenerationError extends DOMDetectionError {
  constructor(element: HTMLElement, reason: string) {
    super(`Failed to generate JS path for element ${element.tagName}: ${reason}`);
    this.name = 'JSPathGenerationError';
  }
}

export class ScrollDetectionError extends DOMDetectionError {
  constructor(element: HTMLElement, reason: string) {
    super(`Failed to detect scroll properties for element ${element.tagName}: ${reason}`);
    this.name = 'ScrollDetectionError';
  }
}

export class VisibilityDetectionError extends DOMDetectionError {
  constructor(element: HTMLElement, reason: string) {
    super(`Failed to detect visibility for element ${element.tagName}: ${reason}`);
    this.name = 'VisibilityDetectionError';
  }
}