/**
 * Handles DOM event dispatching for typing simulation
 * Static utility class for event management
 */
export class EventDispatcher {
  /**
   * Dispatch keyboard events for a character
   */
  static dispatchKeyboardEvents(
    element: HTMLInputElement | HTMLTextAreaElement,
    char: string
  ): void {
    // Simulate keydown event
    const keydownEvent = new KeyboardEvent('keydown', {
      key: char,
      code: `Key${char.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(keydownEvent);

    // Simulate keyup event
    const keyupEvent = new KeyboardEvent('keyup', {
      key: char,
      code: `Key${char.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(keyupEvent);
  }

  /**
   * Dispatch backspace keyboard events
   */
  static dispatchBackspaceEvents(
    element: HTMLInputElement | HTMLTextAreaElement
  ): void {
    // Simulate backspace keydown event
    const backspaceKeydown = new KeyboardEvent('keydown', {
      key: 'Backspace',
      code: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(backspaceKeydown);

    // Simulate backspace keyup event
    const backspaceKeyup = new KeyboardEvent('keyup', {
      key: 'Backspace',
      code: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(backspaceKeyup);
  }

  /**
   * Dispatch input event for character insertion
   */
  static dispatchInputEvent(
    element: HTMLInputElement | HTMLTextAreaElement,
    char: string
  ): void {
    const inputEvent = new InputEvent('input', {
      data: char,
      inputType: 'insertText',
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(inputEvent);
  }

  /**
   * Update element value and dispatch appropriate events
   */
  static updateElementValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string
  ): void {
    element.value = value;

    // Dispatch input event to trigger any listeners
    const inputEvent = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(inputEvent);

    // Also dispatch change event
    const changeEvent = new Event('change', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(changeEvent);
  }
}
