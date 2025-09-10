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

  return (
    <button
      className={`
        ${styles.logoContainer} 
        ${getSizeClass()} 
        ${className}
        flex items-center justify-center
        bg-red-500 hover:bg-red-600 
        disabled:bg-gray-400 disabled:cursor-not-allowed
        transition-colors duration-200
        rounded-full
        border-none
        cursor-pointer
      `}
      style={{ border: 'none' }}
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
