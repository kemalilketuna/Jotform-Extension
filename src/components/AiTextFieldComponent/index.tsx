import React, { useState } from 'react';
import { ServiceFactory } from '@/services/DIContainer';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { AiTextInput } from './AiTextInput';
import { SubmitButton } from './SubmitButton';
import { PodoLogo } from '@/components/PodoLogo';

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
      className={`!fixed !bottom-4 !right-4 !z-[999999] !pointer-events-auto !transition-all !duration-300 !w-81 ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
    >
      <form onSubmit={handleSubmit} className="!relative">
        <div
          className="!bg-white !overflow-hidden !h-14"
          style={{
            border: '1px solid rgba(0, 0, 0, .08)',
            borderRadius: '16px 16px 4px',
          }}
        >
          <div className="!flex !items-center !h-full !pl-1.5 !pr-3 !gap-3">
            <PodoLogo size="md" className="!flex-shrink-0" />
            <AiTextInput
              value={inputText}
              onChange={setInputText}
              onKeyDown={handleKeyDown}
              className="!h-full"
            />
            <SubmitButton
              disabled={!inputText.trim()}
              className="!flex-shrink-0 !pt-0.5"
            />
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
