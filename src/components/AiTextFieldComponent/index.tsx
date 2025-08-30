import React, { useState, useEffect } from 'react';
import { LoggingService } from '../../services/LoggingService';
import { ElementSelectors } from '@/constants/ElementSelectors';
import { AiTextInput } from './AiTextInput';
import { SubmitButton } from './SubmitButton';
import { PlayPauseButton } from './PlayPauseButton';
import { AutomationStateManager, AutomationState, AutomationStateChangeListener } from '@/services/AutomationStateManager';
import { AutomationEngine } from '@/services/AutomationEngine';

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
  const [automationState, setAutomationState] = useState<AutomationState>(AutomationState.STOPPED);

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

  const handlePlayPauseToggle = () => {
    const automationEngine = AutomationEngine.getInstance();
    const stateManager = AutomationStateManager.getInstance();
    
    switch (automationState) {
      case AutomationState.STOPPED:
        // Cannot start automation from UI - automation is started from other triggers
        LoggingService.getInstance().warn(
          'Cannot start automation from play button - automation must be triggered from form submission',
          'AiTextFieldComponent'
        );
        break;
      case AutomationState.RUNNING:
        automationEngine.pause();
        break;
      case AutomationState.PAUSED:
        automationEngine.resume();
        break;
    }
  };

  // Listen for automation state changes
  useEffect(() => {
    const stateManager = AutomationStateManager.getInstance();
    
    // Set initial state
    setAutomationState(stateManager.getState());
    
    // Listen for state changes
    const handleStateChange: AutomationStateChangeListener = (event) => {
      setAutomationState(event.currentState);
    };
    
    stateManager.addStateChangeListener(handleStateChange);
    
    // Cleanup listener on unmount
    return () => {
      stateManager.removeStateChangeListener(handleStateChange);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-5 right-5 z-[999999] pointer-events-auto transition-all duration-300 ${isFocused ? 'w-80' : 'w-64'} ${ElementSelectors.EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS} ${className}`}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center gap-2">
          <PlayPauseButton
            isRunning={automationState === AutomationState.RUNNING}
            onToggle={handlePlayPauseToggle}
            disabled={automationState === AutomationState.STOPPED}
          />
          <div className="relative flex-1">
            <AiTextInput
              value={inputText}
              onChange={setInputText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
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
export { SendIcon, type SendIconProps } from './SendIcon';

// Default export
export default AiTextFieldComponent;
