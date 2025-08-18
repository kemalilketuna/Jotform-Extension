export interface AutomationAction {
    type: 'NAVIGATE' | 'CLICK' | 'WAIT' | 'TYPE';
    target?: string;
    url?: string;
    value?: string;
    delay?: number;
    description: string;
}

export interface AutomationSequence {
    id: string;
    name: string;
    actions: AutomationAction[];
}

export interface AutomationMessage {
    type: 'EXECUTE_SEQUENCE' | 'SEQUENCE_COMPLETE' | 'SEQUENCE_ERROR';
    payload?: AutomationSequence | { error: string; step: number };
}
