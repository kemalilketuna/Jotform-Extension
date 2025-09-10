import React from 'react';
import styles from '@/styles/extension.module.css';

interface StatusMessageProps {
  status: string;
  className?: string;
}

/**
 * Component for displaying current operation status
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
  status,
  className = '',
}) => {
  if (!status) {
    return null;
  }

  return (
    <div className={`${styles.statusMessage} ${className}`}>
      <p className={styles.statusMessageText}>{status}</p>
    </div>
  );
};

export default StatusMessage;
