/**
 * Event system exports
 * Centralized event-driven communication for the extension
 */

export { EventBus } from './EventBus';
export {
  EventTypes,
  type ExtensionEvent,
  type EventType,
  type BaseEvent,
  type AutomationStartedEvent,
  type AutomationStoppedEvent,
  type AutomationStepCompletedEvent,
  type AutomationErrorEvent,
  type DOMReadyEvent,
  type ElementDetectedEvent,
  type NavigationEvent,
  type StatusUpdateEvent,
  type CursorMoveEvent,
  type CursorClickEvent,
  type AudioPlayEvent,
  type StorageChangedEvent,
  type APIRequestEvent,
  type APIResponseEvent,
  type PageSummaryReceivedEvent,
} from './EventTypes';
