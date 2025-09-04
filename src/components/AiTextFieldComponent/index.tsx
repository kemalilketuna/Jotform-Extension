import React, { useState } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { ComponentStrings } from './ComponentStrings';
import { AiTextInput } from './AiTextInput';
import { SubmitButton } from './SubmitButton';
import { StatusMessage } from './StatusMessage';

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
  const [isFocused, setIsFocused] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: 'info' | 'success' | 'error' | 'loading';
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    try {
      setStatus({
        message: ComponentStrings.USER_MESSAGES.SUBMITTING_PROMPT,
        type: 'loading',
      });

      // ComponentService will handle the automation start via onSubmit callback

      // Call the onSubmit callback if provided
      onSubmit?.(trimmedText);

      setInputText('');
      setStatus({
        message: ComponentStrings.USER_MESSAGES.PROMPT_SUBMITTED,
        type: 'success',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    } catch (error) {
      LoggingService.getInstance().error(
        'Failed to submit prompt',
        'AiTextFieldComponent',
        { error: (error as Error).message }
      );

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
      className={`fixed bottom-5 right-5 z-[999999] pointer-events-auto transition-all duration-300 ${isFocused ? 'w-80' : 'w-64'} ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <AiTextInput
            value={inputText}
            onChange={setInputText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
          />
          <SubmitButton disabled={!inputText.trim()} />
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
export { SendIcon, type SendIconProps } from './SendIcon';
export { StatusMessage, type StatusMessageProps } from './StatusMessage';

// Default export
export default AiTextFieldComponent;
