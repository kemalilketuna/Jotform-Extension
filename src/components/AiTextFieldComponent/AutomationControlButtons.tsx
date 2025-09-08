import React, { useState, useEffect } from 'react';
import { ServiceFactory } from '@/services/DIContainer';
import { sendMessage } from '@/services/Messaging/messaging';
import { ComponentStrings } from './ComponentStrings';
import { TimingConfig } from '@/config/TimingConfig';
import { IconPauseFilled } from '@jotforminc/svg-icons';
import { IconPlayFilled } from '@jotforminc/svg-icons';

export interface AutomationControlButtonsProps {
  className?: string;
  onStatusChange?: (
    status: {
      message: string;
      type: 'info' | 'success' | 'error' | 'loading';
    } | null
  ) => void;
}

export const AutomationControlButtons: React.FC<
  AutomationControlButtonsProps
> = ({ className = '', onStatusChange }) => {
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutomationStarted, setHasAutomationStarted] = useState(false);

  // Check automation status on component mount and set up polling
  useEffect(() => {
    const checkAutomationStatus = async () => {
      try {
        const componentService =
          ServiceFactory.getInstance().createComponentService();
        const isRunning = componentService.isAutomationCurrentlyRunning();
        setIsAutomationRunning(isRunning);

        // Once automation has started at least once, enable the button
        if (isRunning && !hasAutomationStarted) {
          setHasAutomationStarted(true);
        }
      } catch (error) {
        ServiceFactory.getInstance()
          .createLoggingService()
          .error(
            'Failed to check automation status',
            'AutomationControlButtons',
            {
              error: (error as Error).message,
            }
          );
      }
    };

    // Initial check
    checkAutomationStatus();

    // Poll every 1 second to keep status updated
    const interval = setInterval(checkAutomationStatus, 1000);

    return () => clearInterval(interval);
  }, [hasAutomationStarted]);

  const handleToggleAutomation = async () => {
    if (isLoading) return;

    setIsLoading(true);

    if (isAutomationRunning) {
      // Stop automation
      onStatusChange?.({
        message: ComponentStrings.USER_MESSAGES.AUTOMATION_CONTROL.STOPPING,
        type: 'loading',
      });

      try {
        await sendMessage('stopAutomation', undefined);
        setIsAutomationRunning(false);
        onStatusChange?.({
          message:
            ComponentStrings.USER_MESSAGES.AUTOMATION_CONTROL.STOP_SUCCESS,
          type: 'success',
        });

        // Clear success message after delay
        setTimeout(() => {
          onStatusChange?.(null);
        }, TimingConfig.AI_TEXT_FIELD_STATUS_DURATION);
      } catch (error) {
        ServiceFactory.getInstance()
          .createLoggingService()
          .error('Failed to stop automation', 'AutomationControlButtons', {
            error: (error as Error).message,
          });

        onStatusChange?.({
          message: ComponentStrings.USER_MESSAGES.AUTOMATION_CONTROL.STOP_ERROR,
          type: 'error',
        });
      }
    } else {
      // Start automation
      onStatusChange?.({
        message: ComponentStrings.USER_MESSAGES.AUTOMATION_CONTROL.STARTING,
        type: 'loading',
      });

      try {
        await sendMessage('startAutomation', undefined);
        setIsAutomationRunning(true);
        setHasAutomationStarted(true);
        onStatusChange?.({
          message:
            ComponentStrings.USER_MESSAGES.AUTOMATION_CONTROL.START_SUCCESS,
          type: 'success',
        });

        // Clear success message after delay
        setTimeout(() => {
          onStatusChange?.(null);
        }, TimingConfig.AI_TEXT_FIELD_STATUS_DURATION);
      } catch (error) {
        ServiceFactory.getInstance()
          .createLoggingService()
          .error('Failed to start automation', 'AutomationControlButtons', {
            error: (error as Error).message,
          });

        onStatusChange?.({
          message:
            ComponentStrings.USER_MESSAGES.AUTOMATION_CONTROL.START_ERROR,
          type: 'error',
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <button
        type="button"
        onClick={handleToggleAutomation}
        disabled={isLoading || (!hasAutomationStarted && !isAutomationRunning)}
        title={
          isAutomationRunning
            ? ComponentStrings.USER_MESSAGES.AUTOMATION_CONTROL.STOP_TOOLTIP
            : ComponentStrings.USER_MESSAGES.AUTOMATION_CONTROL.START_TOOLTIP
        }
        className={`p-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          isAutomationRunning
            ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
        }`}
      >
        {isAutomationRunning ? (
          <IconPauseFilled className="w-4 h-4" />
        ) : (
          <IconPlayFilled className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
