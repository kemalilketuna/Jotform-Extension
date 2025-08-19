// Action Types
export type AutomationActionType = 'NAVIGATE' | 'CLICK' | 'WAIT' | 'TYPE';

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

export type AutomationAction = NavigationAction | ClickAction | TypeAction | WaitAction;

export interface AutomationSequence {
    id: string;
    name: string;
    actions: AutomationAction[];
}

// Message Types
export type AutomationMessageType = 'EXECUTE_SEQUENCE' | 'SEQUENCE_COMPLETE' | 'SEQUENCE_ERROR' | 'UNKNOWN_MESSAGE';

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

export type AutomationMessage = ExecuteSequenceMessage | SequenceCompleteMessage | SequenceErrorMessage | UnknownMessage;

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
