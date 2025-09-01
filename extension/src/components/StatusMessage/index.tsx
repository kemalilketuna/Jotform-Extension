import React from 'react';

interface StatusMessageProps {
  status: string;
}

/**
 * Component for displaying current operation status
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({ status }) => {
  if (!status) {
    return null;
  }

  return (
    <div className="status-message">
      <p>{status}</p>
    </div>
  );
};

export default StatusMessage;
