import React, { useState } from 'react';
import { ServiceFactory } from '@/services/DIContainer';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { TimingConfig } from '@/config/TimingConfig';
import { ComponentStrings } from './ComponentStrings';
import { AiTextInput } from './AiTextInput';
import { SubmitButton } from './SubmitButton';
import { StatusMessage } from './StatusMessage';
import { AutomationControlButtons } from './AutomationControlButtons';

/**
 * AI text field component that appears when the extension is active
 */
export interface AiTextFieldComponentProps {
  onSubmit?: (text: string) => void;
  className?: string;
}

export const AiTextFieldComponent: React.FC<AiTextFieldComponentProps> = ({
  onSubmit,
  className = '',
}) => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<{
    message: string;
    type: 'info' | 'success' | 'error' | 'loading';
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    try {
      // Check if automation is currently running
      const componentService =
        ServiceFactory.getInstance().createComponentService();
      const isAutomationRunning =
        componentService.isAutomationCurrentlyRunning();

      if (isAutomationRunning) {
        setStatus({
          message: ComponentStrings.USER_MESSAGES.AUTOMATION_RUNNING,
          type: 'info',
        });
      } else {
        setStatus({
          message: ComponentStrings.USER_MESSAGES.NEW_SESSION_STARTING,
          type: 'loading',
        });
      }

      // Call the onSubmit callback if provided
      onSubmit?.(trimmedText);

      setInputText('');

      // Show appropriate success message based on automation status
      const successMessage = isAutomationRunning
        ? ComponentStrings.USER_MESSAGES.PROMPT_QUEUED
        : ComponentStrings.USER_MESSAGES.PROMPT_SUBMITTED;

      setStatus({
        message: successMessage,
        type: 'success',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus(null);
      }, TimingConfig.AI_TEXT_FIELD_STATUS_DURATION);
    } catch (error) {
      ServiceFactory.getInstance()
        .createLoggingService()
        .error('Failed to submit prompt', 'AiTextFieldComponent', {
          error: (error as Error).message,
        });

      const errorMessage =
        ComponentStrings.USER_MESSAGES.PROMPT_SUBMISSION_FAILED;

      setStatus({ message: errorMessage, type: 'error' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-[999999] pointer-events-auto transition-all duration-300 w-80 ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <AutomationControlButtons
            className="mr-2"
            onStatusChange={(status) => setStatus(status)}
          />
          <div className="relative flex-1">
            <AiTextInput
              value={inputText}
              onChange={setInputText}
              onKeyDown={handleKeyDown}
            />
            <SubmitButton disabled={!inputText.trim()} />
          </div>
        </div>
        {status && (
          <StatusMessage message={status.message} type={status.type} />
        )}
      </form>
    </div>
  );
};

// Export sub-components
export { AiTextInput, type AiTextInputProps } from './AiTextInput';
export { SubmitButton, type SubmitButtonProps } from './SubmitButton';
export { StatusMessage, type StatusMessageProps } from './StatusMessage';
export {
  AutomationControlButtons,
  type AutomationControlButtonsProps,
} from './AutomationControlButtons';

// Default export
export default AiTextFieldComponent;
