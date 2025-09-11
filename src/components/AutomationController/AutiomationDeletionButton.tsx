import React from 'react';
import { IconTrashFilled } from '@jotforminc/svg-icons';
import { PodoLogoStrings } from '@/components/PodoLogo';
import styles from '@/styles/extension.module.css';

export interface AutomationDeletionButtonProps {
  className?: string;
  size?: keyof typeof PodoLogoStrings.SIZE_CLASSES;
  onClick?: () => void;
  disabled?: boolean;
}

export const AutomationDeletionButton: React.FC<
  AutomationDeletionButtonProps
> = ({ className = '', size = 'md', onClick, disabled = false }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return styles.logoSm;
      case 'lg':
        return styles.logoLg;
      default:
        return styles.logoMd;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 16;
      case 'lg':
        return 32;
      default:
        return 24;
    }
  };

  // bg red #c90909
  // bg hover ab0101

  return (
    <button
      className={`
        ${styles.automationDeletionButton} 
        ${getSizeClass()} 
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      type="button"
      aria-label="Delete automation"
    >
      <IconTrashFilled
        width={getIconSize()}
        height={getIconSize()}
        className="text-white"
      />
    </button>
  );
};

export default AutomationDeletionButton;
