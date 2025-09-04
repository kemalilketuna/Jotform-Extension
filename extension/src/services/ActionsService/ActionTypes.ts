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

export interface ExecutedAction {
  status: 'SUCCESS' | 'FAIL';
  error_message?: string;
}
