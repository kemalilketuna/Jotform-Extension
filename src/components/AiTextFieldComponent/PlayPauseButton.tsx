import React from 'react';
import { IconPlayFilled, IconPauseFilled } from '@jotforminc/svg-icons';
import { ElementSelectors } from '@/constants/ElementSelectors';

export interface PlayPauseButtonProps {
  isRunning: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  isRunning,
  onToggle,
  disabled = false,
  className = '',
  title,
}) => {
  const buttonTitle = title || (isRunning ? 'Pause automation' : 'Start automation');
  
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={buttonTitle}
      className={`
        ${ElementSelectors.EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS}
        flex items-center justify-center
        w-10 h-10
        bg-blue-500 hover:bg-blue-600
        disabled:bg-gray-400 disabled:cursor-not-allowed
        text-white
        rounded-lg
        border-2 border-blue-600
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-600
        transition-all duration-200
        shadow-md hover:shadow-lg
        ${className}
      `}
    >
      {isRunning ? (
        <IconPauseFilled className="w-5 h-5" />
      ) : (
        <IconPlayFilled className="w-5 h-5" />
      )}
    </button>
  );
};

export default PlayPauseButton;