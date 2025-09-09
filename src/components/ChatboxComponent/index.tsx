import React, { useState, useEffect } from 'react';
import { ComponentStrings } from './ComponentStrings';
import { ServiceFactory } from '@/services/DIContainer';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { EventTypes, ExtensionEvent } from '@/events';

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: Date;
}

export interface ChatboxComponentProps {
  messages?: ChatMessage[];
  isVisible?: boolean;
  className?: string;
  maxHeight?: string;
}

/**
 * Chatbox component that displays AI agent messages above the AiTextField
 * Users cannot input messages - this is read-only for AI agent communication
 */
export const ChatboxComponent: React.FC<ChatboxComponentProps> = ({
  messages: externalMessages = [],
  isVisible = true,
  className = '',
  maxHeight = '300px',
}) => {
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(null);
  const serviceFactory = ServiceFactory.getInstance();
  const logger = serviceFactory.createLoggingService();
  const eventBus = serviceFactory.createEventBus();

  // Get the latest message from external messages
  const latestExternalMessage = externalMessages.length > 0 ? externalMessages[externalMessages.length - 1] : null;

  // Subscribe to automation events for real-time messages
  useEffect(() => {
    const setMessage = (content: string) => {
      const newMessage: ChatMessage = {
        id: `auto_${Date.now()}_${Math.random()}`,
        message: content,
        timestamp: new Date(),
      };
      setCurrentMessage(newMessage);
    };

    const handleEvent = (event: ExtensionEvent) => {
      switch (event.type) {
        case EventTypes.AUTOMATION_STARTED:
          setMessage('🤖 Automation started - AI agent is now active');
          break;
        case EventTypes.AUTOMATION_STOPPED:
          setMessage(
            `✅ Automation ${event.reason === 'completed' ? 'completed successfully' : 'stopped'}`
          );
          break;
        case EventTypes.AUTOMATION_STEP_COMPLETED:
          setMessage(`📋 Step ${event.stepIndex + 1} completed`);
          break;
        case EventTypes.AUTOMATION_ERROR:
          setMessage(`❌ Error: ${event.error.message}`);
          break;
        case EventTypes.ELEMENT_DETECTED:
          setMessage(`🎯 Element detected: ${event.selector}`);
          break;
        case EventTypes.NAVIGATION_CHANGED:
          setMessage(`🧭 Navigation: ${event.to}`);
          break;
      }
    };

    // Subscribe to relevant events
    const subIdAutomationStarted = eventBus.on(
      EventTypes.AUTOMATION_STARTED,
      handleEvent
    );
    const subIdAutomationStopped = eventBus.on(
      EventTypes.AUTOMATION_STOPPED,
      handleEvent
    );
    const subIdAutomationStep = eventBus.on(
      EventTypes.AUTOMATION_STEP_COMPLETED,
      handleEvent
    );
    const subIdAutomationError = eventBus.on(
      EventTypes.AUTOMATION_ERROR,
      handleEvent
    );
    const subIdElementDetected = eventBus.on(
      EventTypes.ELEMENT_DETECTED,
      handleEvent
    );
    const subIdNavigation = eventBus.on(
      EventTypes.NAVIGATION_CHANGED,
      handleEvent
    );

    return () => {
      eventBus.off(subIdAutomationStarted);
      eventBus.off(subIdAutomationStopped);
      eventBus.off(subIdAutomationStep);
      eventBus.off(subIdAutomationError);
      eventBus.off(subIdElementDetected);
      eventBus.off(subIdNavigation);
    };
  }, [eventBus]);

  // Update current message when external messages change
  React.useEffect(() => {
    if (latestExternalMessage) {
      setCurrentMessage(latestExternalMessage);
    }
  }, [latestExternalMessage]);

  // Log message updates for debugging
  React.useEffect(() => {
    if (currentMessage) {
      logger.info(
        `ChatboxComponent updated with message: ${currentMessage.message}`,
        'ChatboxComponent'
      );
    }
  }, [currentMessage, logger]);

  // Determine which message to display (prioritize internal over external)
  const displayMessage = currentMessage || latestExternalMessage;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`${ComponentStrings.CSS_CLASSES.CONTAINER} fixed bottom-24 right-5 z-[999998] pointer-events-auto transition-all duration-300 w-80 ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      role="region"
      aria-label={ComponentStrings.ACCESSIBILITY.CHATBOX_CONTAINER}
    >
      <div
        className="bg-white border shadow-lg overflow-hidden"
        style={{ borderRadius: '12px', border: '1px solid #f3f3f3' }}
      >
        {/* Single Message Container */}
        <div
          className={`${ComponentStrings.CSS_CLASSES.MESSAGE_LIST} p-3 min-h-[200px]`}
          style={{ maxHeight }}
          role="log"
          aria-label={ComponentStrings.ACCESSIBILITY.SCROLL_AREA}
          aria-live="polite"
        >
          {!displayMessage ? (
            <div
              className={`${ComponentStrings.CSS_CLASSES.EMPTY_STATE} text-center py-8`}
            >
              <div
                className="z-[2] text-base leading-6 tracking-tight-custom font-inter"
                style={{ color: '#01105c' }}
              >
                {ComponentStrings.CHATBOX_LABELS.EMPTY_STATE}
              </div>
            </div>
          ) : (
            <div
              className={`${ComponentStrings.CSS_CLASSES.MESSAGE_ITEM} mb-3 p-3 rounded-lg bg-gray-50 border-l-4 border-blue-500`}
              role="listitem"
              aria-label={ComponentStrings.ACCESSIBILITY.MESSAGE_ITEM}
            >
              <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {displayMessage.message}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {displayMessage.timestamp.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export types and strings
export { ComponentStrings } from './ComponentStrings';
