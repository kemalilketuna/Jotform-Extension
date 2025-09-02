/**
 * AutomationEngine module exports
 * Provides a clean public API for automation functionality
 */

export { AutomationEngine } from './AutomationEngine';
export { AutomationConfig } from './AutomationConfig';
export { MessageHandler } from './MessageHandler';

// Export error classes
export {
  AutomationError,
  ElementNotFoundError,
  NavigationError,
  ActionExecutionError,
  SequenceExecutionError,
  StringError,
  ContentScriptError,
} from './AutomationErrors';

export type { AutomationMessage } from './MessageTypes';
