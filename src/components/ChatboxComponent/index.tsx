import React from 'react';
import { ComponentStrings } from './ComponentStrings';
import { MessageItem } from './MessageItem';
import { LoggingService } from '@/services/LoggingService';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';

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
  messages = [],
  isVisible = true,
  className = '',
  maxHeight = '300px',
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const logger = LoggingService.getInstance();

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages]);

  // Log message updates for debugging
  React.useEffect(() => {
    logger.info(
      `ChatboxComponent updated with ${messages.length} messages`,
      'ChatboxComponent'
    );
  }, [messages.length, logger]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`${ComponentStrings.CSS_CLASSES.CONTAINER} fixed bottom-24 right-5 z-[999998] pointer-events-auto transition-all duration-300 w-80 ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      role="region"
      aria-label={ComponentStrings.ACCESSIBILITY.CHATBOX_CONTAINER}
    >
      <div className="bg-white border shadow-lg overflow-hidden" style={{ borderRadius: '12px', border: '1px solid #f3f3f3' }}>
        {/* Messages Container */}
        <div
          className={`${ComponentStrings.CSS_CLASSES.MESSAGE_LIST} overflow-y-auto p-3 min-h-[200px]`}
          style={{ maxHeight }}
          role="log"
          aria-label={ComponentStrings.ACCESSIBILITY.SCROLL_AREA}
          aria-live="polite"
        >
          {messages.length === 0 ? (
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
              {messages.map((msg) => (
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