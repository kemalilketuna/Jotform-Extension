import { defineExtensionMessaging } from '@webext-core/messaging';
import {
  NextActionResponse,
  ExecutedAction,
} from '@/services/APIService/APITypes';

interface ProtocolMap {
  captureActiveTab: () => { base64: string };
  getNextAction: (data: {
    sessionId: string;
    visibleElementsHtml: string[];
    lastTurnOutcome: ExecutedAction[];
    screenshotBase64?: string;
  }) => NextActionResponse;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
