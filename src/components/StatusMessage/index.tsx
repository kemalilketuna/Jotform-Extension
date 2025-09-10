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
    <div className="!mb-4 !p-3 !bg-white/10 !rounded-lg !border !border-white/20">
      <p className="!m-0 !text-sm !text-white/90">{status}</p>
    </div>
  );
};

export default StatusMessage;
