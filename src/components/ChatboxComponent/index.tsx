import React from 'react';
import { ComponentStrings } from './ComponentStrings';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';

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
  maxHeight = '300px',
}) => {

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
        {/* Empty State Container */}
        <div
          className={`${ComponentStrings.CSS_CLASSES.MESSAGE_LIST} p-3 min-h-[200px]`}
          style={{ maxHeight }}
          role="log"
          aria-label={ComponentStrings.ACCESSIBILITY.SCROLL_AREA}
        >
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
        </div>
      </div>
    </div>
  );
};

// Export strings
export { ComponentStrings } from './ComponentStrings';
