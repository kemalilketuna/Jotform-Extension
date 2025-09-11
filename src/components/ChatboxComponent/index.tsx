import React, { useState, useEffect } from 'react';
import { IconXmarkSm, IconAiColor } from '@jotforminc/svg-icons';
import { ComponentStrings } from './ComponentStrings';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { MessagingText } from './MessagingText';
import { MessageFactory } from './MessageTypes';
import { ServiceFactory } from '@/services/DIContainer';
import { EventTypes } from '@/events';
import type {
  PageSummaryReceivedEvent,
  AIThinkingEvent,
} from '@/events/EventTypes';
import styles from '@/styles/extension.module.css';

export interface ChatboxComponentProps {
  isVisible?: boolean;
  className?: string;
  maxHeight?: string;
  defaultExpanded?: boolean;
}

/**
 * Chatbox component that displays messages and page summaries with toggle functionality
 */
export const ChatboxComponent: React.FC<ChatboxComponentProps> = ({
  isVisible = true,
  className = '',
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Listen for page summary and AI thinking events
  useEffect(() => {
    const serviceFactory = ServiceFactory.getInstance();
    const logger = serviceFactory.createLoggingService();
    const eventBus = serviceFactory.createEventBus();

    // Listen for page summary events
    const pageSummarySubscriptionId = eventBus.on<PageSummaryReceivedEvent>(
      EventTypes.PAGE_SUMMARY_RECEIVED,
      (event) => {
        try {
          const { sessionId, pageSummary } = event;

          // Validate the page summary content
          const validatedContent =
            MessageFactory.validateMessageContent(pageSummary);

          // Set the current message (replaces any previous message)
          setCurrentMessage(validatedContent);
          setHasNewMessage(true);

          logger.info(
            `Page summary received for session ${sessionId}`,
            'ChatboxComponent'
          );

          // Auto-expand if collapsed and new message arrives
          if (!isExpanded) {
            setIsExpanded(true);
          }
        } catch (error) {
          logger.error(
            `Failed to display page summary: ${error instanceof Error ? error.message : String(error)}`,
            'ChatboxComponent'
          );
        }
      }
    );

    // Listen for AI thinking events
    const aiThinkingSubscriptionId = eventBus.on<AIThinkingEvent>(
      EventTypes.AI_THINKING,
      (event) => {
        try {
          const { sessionId, message } = event;

          // Validate the thinking message content
          const validatedContent =
            MessageFactory.validateMessageContent(message);

          // Set the current message (replaces any previous message)
          setCurrentMessage(validatedContent);
          setHasNewMessage(true);

          logger.info(
            `AI thinking message received for session ${sessionId}`,
            'ChatboxComponent'
          );

          // Auto-expand if collapsed and new message arrives
          if (!isExpanded) {
            setIsExpanded(true);
          }
        } catch (error) {
          logger.error(
            `Failed to display AI thinking message: ${error instanceof Error ? error.message : String(error)}`,
            'ChatboxComponent'
          );
        }
      }
    );

    return () => {
      eventBus.off(pageSummarySubscriptionId);
      eventBus.off(aiThinkingSubscriptionId);
    };
  }, [isExpanded]);

  if (!isVisible) {
    return null;
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (hasNewMessage && !isExpanded) {
      setHasNewMessage(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`${styles.chatboxToggleButton} ${isExpanded ? styles.chatboxExpanded : styles.chatboxCollapsed} ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${hasNewMessage && !isExpanded ? styles.hasNewMessage : ''}`}
        onClick={handleToggle}
        aria-label={ComponentStrings.ACCESSIBILITY.TOGGLE_BUTTON}
        title={
          isExpanded
            ? ComponentStrings.CHATBOX_LABELS.TOGGLE_HIDE
            : ComponentStrings.CHATBOX_LABELS.TOGGLE_SHOW
        }
      >
        {isExpanded ? <IconXmarkSm /> : <IconAiColor />}
        {hasNewMessage && !isExpanded && (
          <span className={styles.newMessageIndicator} aria-hidden="true">
            •
          </span>
        )}
      </button>

      {/* Chatbox Container */}
      <div
        className={`${styles.chatbox} ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
        role="region"
        aria-label={ComponentStrings.ACCESSIBILITY.CHATBOX_CONTAINER}
      >
        <div
          className={`${styles.chatboxSlideContainer} ${isExpanded ? styles.visible : styles.hidden}`}
        >
          <div className={styles.chatboxContainer}>
            {currentMessage ? (
              <div className={styles.chatboxEmptyState}>
                <MessagingText message={currentMessage} />
              </div>
            ) : (
              <div className={styles.chatboxEmptyState}>
                <MessagingText
                  message={ComponentStrings.CHATBOX_LABELS.EMPTY_STATE}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Export strings and components
export { ComponentStrings } from './ComponentStrings';
export { MessagingText } from './MessagingText';
