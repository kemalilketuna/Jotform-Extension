import React from 'react';

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

  return (
    <div className="connection-status">
      <div className={`status-indicator ${connectionStatus}`}>
        <span className="status-dot"></span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {reconnectAttempts > 0 && (
        <div className="reconnect-info">
          <span className="reconnect-text">
            Reconnection attempts: {reconnectAttempts}
          </span>
        </div>
      )}

      {connectionError && (
        <div className="connection-error">
          <span className="error-text">{connectionError}</span>
          <button
            className="reconnect-btn"
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
