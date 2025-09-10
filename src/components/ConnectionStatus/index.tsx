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

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'bg-yellow-500';
      case 'open':
        return 'bg-green-500';
      case 'closing':
        return 'bg-orange-500';
      case 'closed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="mb-4">
      <div className="status-indicator">
        <span className={`status-dot ${getStatusColor()}`}></span>
        <span className="!text-sm !text-white/90">{getStatusText()}</span>
      </div>

      {reconnectAttempts > 0 && (
        <div className="mt-2">
          <span className="!text-xs !text-white/70">
            Reconnection attempts: {reconnectAttempts}
          </span>
        </div>
      )}

      {connectionError && (
        <div className="!mt-2 !p-2 !bg-red-500/20 !rounded !border !border-red-500/30">
          <span className="!text-xs !text-red-200 !block !mb-2">
            {connectionError}
          </span>
          <button
            className="btn-secondary !text-xs !py-1 !px-2"
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
