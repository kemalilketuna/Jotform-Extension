import React from 'react';
import { ComponentStrings } from './ComponentStrings';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { MessagingText } from './MessagingText';
import styles from '@/styles/extension.module.css';

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
      className={`${styles.chatbox} ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      role="region"
      aria-label={ComponentStrings.ACCESSIBILITY.CHATBOX_CONTAINER}
    >
      <div className={styles.chatboxContainer}>
        <div className={styles.chatboxEmptyState}>
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
