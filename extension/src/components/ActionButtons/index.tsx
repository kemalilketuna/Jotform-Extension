import React from 'react';

interface ActionButtonsProps {
  isExecuting: boolean;
  isConnected: boolean;
  onCreateForm: () => Promise<void>;
  onBuildForm: () => Promise<void>;
  onListInteractiveElements: () => void;
}

/**
 * Component for action buttons (Create Form and Build Form)
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isExecuting,
  isConnected,
  onCreateForm,
  onBuildForm,
  onListInteractiveElements,
}) => {
  const getButtonTitle = () => {
    return !isConnected ? 'Connect to server first' : '';
  };

  const isButtonDisabled = isExecuting || !isConnected;

  const createButtonClasses = `bg-jotform-primary hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-jotform-primary/50 w-full mb-2 text-sm ${
    isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  const buildButtonClasses = `bg-jotform-secondary hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-jotform-secondary/50 w-full mb-2 text-sm ${
    isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  return (
    <div className="space-y-2">
      <button
        className={createButtonClasses}
        onClick={onCreateForm}
        disabled={isButtonDisabled}
        title={getButtonTitle()}
      >
        {isExecuting ? 'Creating...' : 'Create Form'}
      </button>

      <button
        className={buildButtonClasses}
        onClick={onBuildForm}
        disabled={isButtonDisabled}
        title={getButtonTitle()}
      >
        {isExecuting ? 'Building...' : 'Build Form'}
      </button>

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
