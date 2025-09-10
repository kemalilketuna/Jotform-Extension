import React from 'react';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { IconArrowUp } from '@jotforminc/svg-icons';
import styles from '@/styles/extension.module.css';

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
      className={`${styles.submitButton} ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
      title={title}
    >
      <IconArrowUp className={styles.submitButtonIcon} />
    </button>
  );
};

export default SubmitButton;
