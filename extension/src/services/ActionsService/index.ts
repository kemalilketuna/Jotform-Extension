/**
 * ActionsService module exports
 * Provides a clean public API for action execution functionality
 */

export { ActionsService } from './ActionsService';
export { ActionHandlers } from './ActionHandlers';

// Re-export types that might be needed by consumers
export type {
  AutomationAction,
  AutomationSequence,
  AutomationActionType,
  NavigationAction,
  ClickAction,
  TypeAction,
  WaitAction,
  BaseAutomationAction,
} from './ActionTypes';
