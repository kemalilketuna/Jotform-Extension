import React, { useState } from 'react';
import { IconChevronDown, IconChevronUp } from '@jotforminc/svg-icons';
import { ComponentStrings } from './ComponentStrings';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { MessagingText } from './MessagingText';
import styles from '@/styles/extension.module.css';

export interface ChatboxComponentProps {
  isVisible?: boolean;
  className?: string;
  maxHeight?: string;
  defaultExpanded?: boolean;
}

/**
 * Chatbox component that displays the empty state message with toggle functionality
 */
export const ChatboxComponent: React.FC<ChatboxComponentProps> = ({
  isVisible = true,
  className = '',
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!isVisible) {
    return null;
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`${styles.chatboxToggleButton} ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS}`}
        onClick={handleToggle}
        aria-label={ComponentStrings.ACCESSIBILITY.TOGGLE_BUTTON}
        title={
          isExpanded
            ? ComponentStrings.CHATBOX_LABELS.TOGGLE_HIDE
            : ComponentStrings.CHATBOX_LABELS.TOGGLE_SHOW
        }
      >
        {isExpanded ? <IconChevronDown /> : <IconChevronUp />}
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
            <div className={styles.chatboxEmptyState}>
              <MessagingText
                message={ComponentStrings.CHATBOX_LABELS.EMPTY_STATE}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Export strings and components
export { ComponentStrings } from './ComponentStrings';
export { MessagingText } from './MessagingText';
