import React, { useState, useEffect, useMemo } from 'react';
import { ComponentStrings } from './ComponentStrings';
import { MessageItem } from './MessageItem';
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
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const serviceFactory = ServiceFactory.getInstance();
  const logger = serviceFactory.createLoggingService();
  const eventBus = serviceFactory.createEventBus();

  // Combine external and internal messages
  const allMessages = useMemo(
    () => [...externalMessages, ...internalMessages],
    [externalMessages, internalMessages]
  );

  // Subscribe to automation events for real-time messages
  useEffect(() => {
    const addMessage = (content: string) => {
      const newMessage: ChatMessage = {
        id: `auto_${Date.now()}_${Math.random()}`,
        message: content,
        timestamp: new Date(),
      };
      setInternalMessages((prev) => [...prev, newMessage]);
    };

    const handleEvent = (event: ExtensionEvent) => {
      switch (event.type) {
        case EventTypes.AUTOMATION_STARTED:
          addMessage('🤖 Automation started - AI agent is now active');
          break;
        case EventTypes.AUTOMATION_STOPPED:
          addMessage(
            `✅ Automation ${event.reason === 'completed' ? 'completed successfully' : 'stopped'}`
          );
          break;
        case EventTypes.AUTOMATION_STEP_COMPLETED:
          addMessage(`📋 Step ${event.stepIndex + 1} completed`);
          break;
        case EventTypes.AUTOMATION_ERROR:
          addMessage(`❌ Error: ${event.error.message}`);
          break;
        case EventTypes.ELEMENT_DETECTED:
          addMessage(`🎯 Element detected: ${event.selector}`);
          break;
        case EventTypes.NAVIGATION_CHANGED:
          addMessage(`🧭 Navigation: ${event.to}`);
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

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messagesEndRef.current && allMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [allMessages]);

  // Log message updates for debugging
  React.useEffect(() => {
    logger.info(
      `ChatboxComponent updated with ${allMessages.length} messages`,
      'ChatboxComponent'
    );
  }, [allMessages.length, logger]);

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
        {/* Messages Container */}
        <div
          className={`${ComponentStrings.CSS_CLASSES.MESSAGE_LIST} overflow-y-auto p-3 min-h-[200px]`}
          style={{ maxHeight }}
          role="log"
          aria-label={ComponentStrings.ACCESSIBILITY.SCROLL_AREA}
          aria-live="polite"
        >
          {allMessages.length === 0 ? (
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
            <div role="list">
              {allMessages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg.message}
                  timestamp={msg.timestamp}
                />
              ))}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export sub-components and types
export { MessageItem, type MessageItemProps } from './MessageItem';
export { ComponentStrings } from './ComponentStrings';
