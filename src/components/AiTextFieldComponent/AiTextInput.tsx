import React from 'react';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';

export interface AiTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  title?: string;
}

export const AiTextInput: React.FC<AiTextInputProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  placeholder = 'Ask AI',
  className = '',
  title = 'Ask AI for assistance',
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`w-full bg-transparent text-gray-800 placeholder-gray-500 transition-all duration-200 focus:outline-none ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      title={title}
    />
  );
};

export default AiTextInput;
