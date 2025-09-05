import React from 'react';
import { ComponentStrings, ChatboxStringError } from './ComponentStrings';

export interface MessageItemProps {
  message: string;
  timestamp?: Date;
  className?: string;
}

/**
 * Individual message item component for the chatbox
 */
export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  timestamp,
  className = '',
}) => {
  // Validate message using string management class
  const validatedMessage = React.useMemo(() => {
    try {
      return ChatboxStringError.validateMessage(message);
    } catch (error) {
      console.error('Invalid message in MessageItem:', error);
      return ComponentStrings.CHATBOX_LABELS.EMPTY_STATE;
    }
  }, [message]);

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div
      className={`${ComponentStrings.CSS_CLASSES.MESSAGE_ITEM} mb-3 animate-fade-in ${className}`}
      role="listitem"
      aria-label={ComponentStrings.ACCESSIBILITY.MESSAGE_ITEM}
    >
      <div className="bg-white border border-gray-100 p-3 shadow-sm" style={{borderRadius: '12px', border: '1px solid #f3f3f3'}}>
        <div className="flex items-start space-x-2">
          {/* AI Agent Icon */}
          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          
          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 leading-relaxed break-words">
              {validatedMessage}
            </p>
            {timestamp && (
              <p className="text-xs text-gray-500 mt-1">
                {formatTimestamp(timestamp)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};