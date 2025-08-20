// Action Types
export type AutomationActionType = 'NAVIGATE' | 'CLICK' | 'WAIT' | 'TYPE';

// Visual Animation Types
export interface CursorPosition {
  x: number;
  y: number;
}

export interface VisualAnimationConfig {
  enabled: boolean;
  animationSpeed: number; // ms per pixel
  hoverDuration: number; // ms to hover before click
  clickDuration: number; // ms for click animation
}

export interface VisualCursorState {
  isVisible: boolean;
  position: CursorPosition;
  isAnimating: boolean;
  isHovering: boolean;
  isClicking: boolean;
}

export interface BaseAutomationAction {
  type: AutomationActionType;
  description: string;
  delay?: number;
}

export interface NavigationAction extends BaseAutomationAction {
  type: 'NAVIGATE';
  url: string;
}

export interface ClickAction extends BaseAutomationAction {
  type: 'CLICK';
  target: string;
}

export interface TypeAction extends BaseAutomationAction {
  type: 'TYPE';
  target: string;
  value: string;
}

export interface WaitAction extends BaseAutomationAction {
  type: 'WAIT';
  delay: number;
}

export type AutomationAction =
  | NavigationAction
  | ClickAction
  | TypeAction
  | WaitAction;

export interface AutomationSequence {
  id: string;
  name: string;
  actions: AutomationAction[];
}

// Message Types
export type AutomationMessageType =
  | 'EXECUTE_SEQUENCE'
  | 'SEQUENCE_COMPLETE'
  | 'SEQUENCE_ERROR'
  | 'UNKNOWN_MESSAGE'
  | 'CONTINUE_AUTOMATION'
  | 'AUTOMATION_STATE_REQUEST'
  | 'AUTOMATION_STATE_RESPONSE'
  | 'NAVIGATION_DETECTED'
  | 'CONTENT_SCRIPT_READY';

export interface BaseAutomationMessage {
  type: AutomationMessageType;
}

export interface ExecuteSequenceMessage extends BaseAutomationMessage {
  type: 'EXECUTE_SEQUENCE';
  payload: AutomationSequence;
}

export interface SequenceCompleteMessage extends BaseAutomationMessage {
  type: 'SEQUENCE_COMPLETE';
  payload: { sequenceId: string };
}

export interface SequenceErrorMessage extends BaseAutomationMessage {
  type: 'SEQUENCE_ERROR';
  payload: { error: string; step?: number };
}

export interface UnknownMessage extends BaseAutomationMessage {
  type: 'UNKNOWN_MESSAGE';
  payload: { error: string };
}

export interface ContinueAutomationMessage extends BaseAutomationMessage {
  type: 'CONTINUE_AUTOMATION';
  payload: { tabId: number; url: string };
}

export interface AutomationStateRequestMessage extends BaseAutomationMessage {
  type: 'AUTOMATION_STATE_REQUEST';
  payload: { tabId: number };
}

export interface AutomationStateResponseMessage extends BaseAutomationMessage {
  type: 'AUTOMATION_STATE_RESPONSE';
  payload: {
    hasActiveAutomation: boolean;
    currentSequence?: AutomationSequence;
    currentStepIndex?: number;
    pendingActions?: AutomationAction[];
  };
}

export interface NavigationDetectedMessage extends BaseAutomationMessage {
  type: 'NAVIGATION_DETECTED';
  payload: { fromUrl: string; toUrl: string; tabId: number };
}

export interface ContentScriptReadyMessage extends BaseAutomationMessage {
  type: 'CONTENT_SCRIPT_READY';
  payload: { tabId: number; url: string };
}

export type AutomationMessage =
  | ExecuteSequenceMessage
  | SequenceCompleteMessage
  | SequenceErrorMessage
  | UnknownMessage
  | ContinueAutomationMessage
  | AutomationStateRequestMessage
  | AutomationStateResponseMessage
  | NavigationDetectedMessage
  | ContentScriptReadyMessage;

// Browser Extension Types
export interface ExtensionTab {
  id?: number;
  url?: string;
  title?: string;
}

export interface MessageSender {
  tab?: ExtensionTab;
  frameId?: number;
  id?: string;
  url?: string;
}

export type MessageResponse = (response?: AutomationMessage) => void;
