/**
 * Event types for the extension's event-driven communication system
 * Provides type-safe event definitions for loose coupling between services
 */

// Base event interface
export interface BaseEvent {
  readonly type: string;
  readonly timestamp: number;
  readonly source?: string;
}

// Automation events
export interface AutomationStartedEvent extends BaseEvent {
  readonly type: 'automation:started';
  readonly sessionId: string;
  readonly objective: string;
}

export interface AutomationStoppedEvent extends BaseEvent {
  readonly type: 'automation:stopped';
  readonly sessionId: string;
  readonly reason: 'user_request' | 'error' | 'completed';
}

export interface AutomationStepCompletedEvent extends BaseEvent {
  readonly type: 'automation:step_completed';
  readonly sessionId: string;
  readonly stepIndex: number;
  readonly action: Record<string, unknown>;
}

export interface AutomationErrorEvent extends BaseEvent {
  readonly type: 'automation:error';
  readonly sessionId: string;
  readonly error: Error;
  readonly context?: Record<string, unknown>;
}

// DOM events
export interface DOMReadyEvent extends BaseEvent {
  readonly type: 'dom:ready';
  readonly url: string;
}

export interface ElementDetectedEvent extends BaseEvent {
  readonly type: 'dom:element_detected';
  readonly element: Element;
  readonly selector: string;
}

export interface NavigationEvent extends BaseEvent {
  readonly type: 'navigation:changed';
  readonly from: string;
  readonly to: string;
}

// UI events
export interface StatusUpdateEvent extends BaseEvent {
  readonly type: 'ui:status_update';
  readonly status: string;
  readonly level: 'info' | 'warning' | 'error' | 'success';
}

export interface CursorMoveEvent extends BaseEvent {
  readonly type: 'cursor:move';
  readonly x: number;
  readonly y: number;
  readonly element?: Element;
}

export interface CursorClickEvent extends BaseEvent {
  readonly type: 'cursor:click';
  readonly x: number;
  readonly y: number;
  readonly element: Element;
}

// Audio events
export interface AudioPlayEvent extends BaseEvent {
  readonly type: 'audio:play';
  readonly soundType: 'keystroke' | 'click' | 'error' | 'success';
  readonly enabled: boolean;
  readonly metadata?: Record<string, unknown>;
}

// Storage events
export interface StorageChangedEvent extends BaseEvent {
  readonly type: 'storage:changed';
  readonly key: string;
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

// API events
export interface APIRequestEvent extends BaseEvent {
  readonly type: 'api:request';
  readonly endpoint: string;
  readonly method: string;
}

export interface APIResponseEvent extends BaseEvent {
  readonly type: 'api:response';
  readonly endpoint: string;
  readonly status: number;
  readonly success: boolean;
}

// Page summary events
export interface PageSummaryReceivedEvent extends BaseEvent {
  readonly type: 'page_summary:received';
  readonly sessionId: string;
  readonly pageSummary: string;
}

// Union type of all events
export type ExtensionEvent =
  | AutomationStartedEvent
  | AutomationStoppedEvent
  | AutomationStepCompletedEvent
  | AutomationErrorEvent
  | DOMReadyEvent
  | ElementDetectedEvent
  | NavigationEvent
  | StatusUpdateEvent
  | CursorMoveEvent
  | CursorClickEvent
  | AudioPlayEvent
  | StorageChangedEvent
  | APIRequestEvent
  | APIResponseEvent
  | PageSummaryReceivedEvent;

// Event type constants for type safety
export const EventTypes = {
  AUTOMATION_STARTED: 'automation:started',
  AUTOMATION_STOPPED: 'automation:stopped',
  AUTOMATION_STEP_COMPLETED: 'automation:step_completed',
  AUTOMATION_ERROR: 'automation:error',
  DOM_READY: 'dom:ready',
  ELEMENT_DETECTED: 'dom:element_detected',
  NAVIGATION_CHANGED: 'navigation:changed',
  STATUS_UPDATE: 'ui:status_update',
  CURSOR_MOVE: 'cursor:move',
  CURSOR_CLICK: 'cursor:click',
  AUDIO_PLAY: 'audio:play',
  STORAGE_CHANGED: 'storage:changed',
  API_REQUEST: 'api:request',
  API_RESPONSE: 'api:response',
  PAGE_SUMMARY_RECEIVED: 'page_summary:received',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];
