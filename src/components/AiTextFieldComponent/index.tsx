import React, { useState } from 'react';
import { ServiceFactory } from '@/services/DIContainer';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { AiTextInput } from './AiTextInput';
import { SubmitButton } from './SubmitButton';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    try {
      // Call the onSubmit callback if provided
      onSubmit?.(trimmedText);

      setInputText('');
    } catch (error) {
      ServiceFactory.getInstance()
        .createLoggingService()
        .error('Failed to submit prompt', 'AiTextFieldComponent', {
          error: (error as Error).message,
        });
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
          <AutomationControlButtons className="mr-2" />
          <div className="relative flex-1">
            <AiTextInput
              value={inputText}
              onChange={setInputText}
              onKeyDown={handleKeyDown}
            />
            <SubmitButton disabled={!inputText.trim()} />
          </div>
        </div>
      </form>
    </div>
  );
};

// Export sub-components
export { AiTextInput, type AiTextInputProps } from './AiTextInput';
export { SubmitButton, type SubmitButtonProps } from './SubmitButton';
export {
  AutomationControlButtons,
  type AutomationControlButtonsProps,
} from './AutomationControlButtons';

// Default export
export default AiTextFieldComponent;
