import React from 'react';
import { ComponentStrings } from './ComponentStrings';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { MessagingText } from './MessagingText';

export interface ChatboxComponentProps {
  isVisible?: boolean;
  className?: string;
  maxHeight?: string;
}

/**
 * Chatbox component that displays the empty state message
 */
export const ChatboxComponent: React.FC<ChatboxComponentProps> = ({
  isVisible = true,
  className = '',
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`${ComponentStrings.CSS_CLASSES.CONTAINER} !fixed !bottom-21 !right-4 !z-[999998] !pointer-events-auto !transition-all !duration-300 ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      role="region"
      aria-label={ComponentStrings.ACCESSIBILITY.CHATBOX_CONTAINER}
    >
      <div
        className="!bg-white !border !overflow-hidden !w-81 !p-4 !min-h-[120px] !max-h-[300px] !rounded-xl"
        style={{
          border: '1px solid #f3f3f3',
          boxShadow:
            '0 16px 24px 0 rgba(5, 53, 85, .06), 0 2px 8px 0 rgba(5, 53, 85, .01)',
        }}
      >
        <div
          className={`${ComponentStrings.CSS_CLASSES.EMPTY_STATE} !text-center`}
        >
          <MessagingText
            message={ComponentStrings.CHATBOX_LABELS.EMPTY_STATE}
          />
        </div>
      </div>
    </div>
  );
};

// Export strings and components
export { ComponentStrings } from './ComponentStrings';
export { MessagingText } from './MessagingText';
