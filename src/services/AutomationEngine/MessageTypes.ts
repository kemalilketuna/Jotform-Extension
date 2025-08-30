import type { AutomationSequence, AutomationAction } from './ActionTypes';

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
  | 'PAUSE_AUTOMATION'
  | 'RESUME_AUTOMATION'
  | 'STOP_AUTOMATION'
  | 'AUTOMATION_PAUSED'
  | 'AUTOMATION_RESUMED'
  | 'AUTOMATION_STOPPED';

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

export interface PauseAutomationMessage extends BaseAutomationMessage {
  type: 'PAUSE_AUTOMATION';
  payload: { tabId?: number };
}

export interface ResumeAutomationMessage extends BaseAutomationMessage {
  type: 'RESUME_AUTOMATION';
  payload: { tabId?: number };
}

export interface StopAutomationMessage extends BaseAutomationMessage {
  type: 'STOP_AUTOMATION';
  payload: { tabId?: number };
}

export interface AutomationPausedMessage extends BaseAutomationMessage {
  type: 'AUTOMATION_PAUSED';
  payload: { sequenceId: string; currentStepIndex: number };
}

export interface AutomationResumedMessage extends BaseAutomationMessage {
  type: 'AUTOMATION_RESUMED';
  payload: { sequenceId: string; currentStepIndex: number };
}

export interface AutomationStoppedMessage extends BaseAutomationMessage {
  type: 'AUTOMATION_STOPPED';
  payload: { sequenceId: string; reason: string };
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
  | PauseAutomationMessage
  | ResumeAutomationMessage
  | StopAutomationMessage
  | AutomationPausedMessage
  | AutomationResumedMessage
  | AutomationStoppedMessage;
