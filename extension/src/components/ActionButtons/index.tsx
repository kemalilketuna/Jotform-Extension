import React from 'react';

interface ActionButtonsProps {
  isExecuting: boolean;
  isConnected: boolean;
  onCreateForm: () => Promise<void>;
  onBuildForm: () => Promise<void>;
}

/**
 * Component for action buttons (Create Form and Build Form)
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isExecuting,
  isConnected,
  onCreateForm,
  onBuildForm,
}) => {
  const getButtonClasses = (baseClass: string) => {
    const classes = [baseClass];
    if (isExecuting) classes.push('executing');
    if (!isConnected) classes.push('disabled');
    return classes.join(' ');
  };

  const getButtonTitle = () => {
    return !isConnected ? 'Connect to server first' : '';
  };

  const isButtonDisabled = isExecuting || !isConnected;

  return (
    <div className="controls">
      <button
        className={getButtonClasses('create-form-btn')}
        onClick={onCreateForm}
        disabled={isButtonDisabled}
        title={getButtonTitle()}
      >
        {isExecuting ? 'Creating...' : 'Create Form'}
      </button>

      <button
        className={getButtonClasses('build-form-btn')}
        onClick={onBuildForm}
        disabled={isButtonDisabled}
        title={getButtonTitle()}
      >
        {isExecuting ? 'Building...' : 'Build Form'}
      </button>
    </div>
  );
};

export default ActionButtons;
