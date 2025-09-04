import React from 'react';

export interface StatusMessageProps {
  message: string;
  type: 'info' | 'success' | 'error' | 'loading';
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type,
}) => {
  const getStatusClasses = () => {
    switch (type) {
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'loading':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`text-xs p-2 rounded-md mt-1 ${getStatusClasses()}`}>
      {type === 'loading' && (
        <span className="inline-block mr-1 h-2 w-2 rounded-full bg-current animate-pulse"></span>
      )}
      {message}
    </div>
  );
};

export default StatusMessage;
