import React, { useState } from 'react';
import { LoggingService } from '../../services/LoggingService';
import { AiTextInput } from './AiTextInput';
import { SubmitButton } from './SubmitButton';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      LoggingService.getInstance().info(
        'AI text submitted',
        'AiTextFieldComponent',
        { inputText }
      );
      onSubmit?.(inputText.trim());
      setInputText('');
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
      className={`fixed bottom-5 right-5 z-[999999] pointer-events-auto transition-all duration-300 ${isFocused ? 'w-80' : 'w-64'
        } ${className}`}
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
      </form>
    </div>
  );
};

export default AiTextFieldComponent;
