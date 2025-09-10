import React from 'react';
import styles from '@/styles/extension.module.css';

export interface MessagingTextProps {
  message?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * MessagingText component for displaying individual message text with Inter font
 */
export const MessagingText: React.FC<MessagingTextProps> = ({
  message = '',
  className = '',
  style = {},
}) => {
  return (
    <span className={`${styles.messagingText} ${className}`} style={style}>
      {message}
    </span>
  );
};
