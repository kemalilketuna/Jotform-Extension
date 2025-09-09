import React from 'react';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { IconAnglesUp } from '@jotforminc/svg-icons';

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
      className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:opacity-80 disabled:!bg-gray-400 disabled:!cursor-not-allowed disabled:!opacity-50 transition-all duration-200 ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      style={{ backgroundColor: disabled ? undefined : '#091551' }}
      title={title}
    >
      <IconAnglesUp className={`fill-white w-5 h-5`} />
    </button>
  );
};

export default SubmitButton;
