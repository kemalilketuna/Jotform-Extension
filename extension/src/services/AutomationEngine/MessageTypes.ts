import type {
  AutomationSequence,
  AutomationAction,
} from '@/services/ActionsService/ActionTypes';

export type AutomationMessageType =
  | 'EXECUTE_SEQUENCE'
  | 'SEQUENCE_COMPLETE'
  | 'SEQUENCE_ERROR'
  | 'UNKNOWN_MESSAGE'
  | 'CONTINUE_AUTOMATION'
  | 'AUTOMATION_STATE_REQUEST'
  | 'AUTOMATION_STATE_RESPONSE'
  | 'NAVIGATION_DETECTED'
  | 'CONTENT_SCRIPT_READY'
  | 'STEP_PROGRESS_UPDATE'
  | 'LIST_INTERACTIVE_ELEMENTS'
  | 'INIT_SESSION'
  | 'INIT_SESSION_RESPONSE'
  | 'REQUEST_NEXT_STEP'
  | 'NEXT_STEP_RESPONSE'
  | 'START_AUTOMATION'
  | 'START_AUTOMATION_RESPONSE';

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

export interface StepProgressUpdateMessage extends BaseAutomationMessage {
  type: 'STEP_PROGRESS_UPDATE';
  payload: { completedStepIndex: number; sequenceId: string };
}

export interface ListInteractiveElementsMessage extends BaseAutomationMessage {
  type: 'LIST_INTERACTIVE_ELEMENTS';
  payload?: {};
}

export interface InitSessionMessage extends BaseAutomationMessage {
  type: 'INIT_SESSION';
  payload: { objective: string };
}

export interface InitSessionResponseMessage extends BaseAutomationMessage {
  type: 'INIT_SESSION_RESPONSE';
  payload: { sessionId: string; success: boolean; error?: string };
}

export interface RequestNextStepMessage extends BaseAutomationMessage {
  type: 'REQUEST_NEXT_STEP';
  payload: { sessionId: string; currentStepIndex: number };
}

export interface NextStepResponseMessage extends BaseAutomationMessage {
  type: 'NEXT_STEP_RESPONSE';
  payload: {
    sessionId: string;
    step?: AutomationAction;
    hasMoreSteps: boolean;
    success: boolean;
    error?: string;
  };
}

export interface StartAutomationMessage extends BaseAutomationMessage {
  type: 'START_AUTOMATION';
  payload: { objective: string };
}

export interface StartAutomationResponseMessage extends BaseAutomationMessage {
  type: 'START_AUTOMATION_RESPONSE';
  payload: { sessionId: string; success: boolean; error?: string };
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
  | ContentScriptReadyMessage
  | StepProgressUpdateMessage
  | ListInteractiveElementsMessage
  | InitSessionMessage
  | InitSessionResponseMessage
  | RequestNextStepMessage
  | NextStepResponseMessage
  | StartAutomationMessage
  | StartAutomationResponseMessage;
