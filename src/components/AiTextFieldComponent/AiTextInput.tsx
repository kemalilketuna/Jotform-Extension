import React from 'react';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import styles from '@/styles/extension.module.css';

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
      className={`${styles.aiTextInput} ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      title={title}
    />
  );
};

export default AiTextInput;
