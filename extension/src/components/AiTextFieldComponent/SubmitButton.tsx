import React from 'react';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { SendIcon } from './SendIcon';

export interface SubmitButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  disabled = false,
  onClick,
  className = '',
  title = 'Send message',
}) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={onClick}
      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50 transition-colors duration-200 ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      title={title}
    >
      <SendIcon />
    </button>
  );
};

export default SubmitButton;
