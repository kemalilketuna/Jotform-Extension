import React from 'react';

interface ActionButtonsProps {
  isExecuting: boolean;
  onListInteractiveElements: () => void;
}

/**
 * Component for action buttons (Create Form and Build Form)
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isExecuting,
  onListInteractiveElements,
}) => {
  return (
    <div className="space-y-2">
      <button
        onClick={onListInteractiveElements}
        disabled={isExecuting}
        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 w-full mb-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        List Interactive Elements
      </button>
    </div>
  );
};

export default ActionButtons;
