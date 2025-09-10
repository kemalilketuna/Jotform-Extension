import React from 'react';
import styles from '@/styles/extension.module.css';

interface ConnectionStatusProps {
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed';
  reconnectAttempts: number;
  connectionError: string | null;
  onForceReconnect: () => Promise<void>;
}

/**
 * Component for displaying connection status with reconnection controls
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  reconnectAttempts,
  connectionError,
  onForceReconnect,
}) => {
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'open':
        return 'Connected';
      case 'closing':
        return 'Disconnecting...';
      case 'closed':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColorClass = () => {
    switch (connectionStatus) {
      case 'connecting':
        return styles.connectionStatusConnecting;
      case 'open':
        return styles.connectionStatusOpen;
      case 'closing':
        return styles.connectionStatusClosing;
      case 'closed':
        return styles.connectionStatusClosed;
      default:
        return styles.connectionStatusDefault;
    }
  };

  return (
    <div className={styles.connectionStatus}>
      <div className={styles.connectionStatusIndicator}>
        <span
          className={`${styles.connectionStatusDot} ${getStatusColorClass()}`}
        ></span>
        <span className={styles.connectionStatusText}>{getStatusText()}</span>
      </div>

      {reconnectAttempts > 0 && (
        <div className={styles.connectionStatusReconnect}>
          <span className={styles.connectionStatusAttempts}>
            Reconnection attempts: {reconnectAttempts}
          </span>
        </div>
      )}

      {connectionError && (
        <div className={styles.connectionStatusError}>
          <span className={styles.connectionStatusErrorText}>
            {connectionError}
          </span>
          <button
            className={styles.connectionStatusButton}
            onClick={onForceReconnect}
            disabled={connectionStatus === 'connecting'}
          >
            {connectionStatus === 'connecting'
              ? 'Connecting...'
              : 'Retry Connection'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
