import React, { useState, useEffect } from 'react';
import { ServiceFactory } from '@/services/DIContainer';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { AiTextInput } from './AiTextInput';
import { SubmitButton } from './SubmitButton';
import { AutomationController } from '../AutomationController';
import { browser } from 'wxt/browser';
import { RequestUserInputMessage, UserResponseMessage } from '@/services/AutomationEngine/MessageTypes';
import styles from '@/styles/extension.module.css';

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
  const [isWaitingForUserInput, setIsWaitingForUserInput] = useState(false);
  const [userInputQuestion, setUserInputQuestion] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    try {
      if (isWaitingForUserInput) {
        // Send user response message
        const userResponseMessage: UserResponseMessage = {
          type: 'USER_RESPONSE',
          payload: {
            response: trimmedText,
            sessionId: currentSessionId,
          },
        };
        
        await browser.runtime.sendMessage(userResponseMessage);
        
        // Reset state
        setIsWaitingForUserInput(false);
        setUserInputQuestion('');
      } else {
        // Call the onSubmit callback if provided
        onSubmit?.(trimmedText);
      }

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

  // Listen for REQUEST_USER_INPUT messages
  useEffect(() => {
    const handleMessage = (message: any) => {
       if (message.type === 'REQUEST_USER_INPUT') {
         const requestMessage = message as RequestUserInputMessage;
         setIsWaitingForUserInput(true);
         setUserInputQuestion(requestMessage.payload.question);
         setCurrentSessionId(requestMessage.payload.sessionId);
       }
     };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div
      className={`${styles.aiTextField} ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
    >
      <form onSubmit={handleSubmit} className={styles.aiTextFieldForm}>
        <div className={styles.aiTextFieldContainer}>
          <div className={styles.aiTextFieldInner}>
            <AutomationController />
            <AiTextInput
              value={inputText}
              onChange={setInputText}
              onKeyDown={handleKeyDown}
              placeholder={isWaitingForUserInput ? userInputQuestion : undefined}
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

// Default export
export default AiTextFieldComponent;
