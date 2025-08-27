/**
 * AutomationEngine module exports
 * Provides a clean public API for automation functionality
 */

export { AutomationEngine } from './AutomationEngine';
export { AutomationConfig } from './AutomationConfig';
export { ActionHandlers } from './ActionHandlers';
export { ElementUtils } from './ElementUtils';
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

// Re-export types that might be needed by consumers
export type {
  AutomationAction,
  AutomationSequence,
  AutomationActionType,
} from './ActionTypes';

export type { AutomationMessage } from './MessageTypes';
