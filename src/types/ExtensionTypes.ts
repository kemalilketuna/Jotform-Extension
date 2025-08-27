import type { AutomationMessage } from '../services/AutomationEngine/MessageTypes';

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
