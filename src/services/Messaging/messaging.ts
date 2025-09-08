import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  captureActiveTab: () => { base64: string };
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
