import React, { useState } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { ErrorMessages, PromptMessages } from '@/services/MessagesService';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { PopupHeader } from '@/components/PopupHeader';
import { StatusMessage } from '@/components/StatusMessage';
import { ActionButtons } from '@/components/ActionButtons';
import { PopupFooter } from '@/components/PopupFooter';

/**
 * Main popup component for the JotForm extension
 */
function App() {
  const [status, setStatus] = useState<string>('');
  const logger = LoggingService.getInstance();

  /**
   * Get the current active tab
   */
  const getCurrentTab = async () => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.id) {
      throw new Error(ErrorMessages.getAll().NO_ACTIVE_TAB);
    }

    return tab;
  };

  /**
   * Handle listing visible interactive elements
   */
  const listInteractiveElements = async () => {
    try {
      setStatus('Detecting interactive elements...');
      logger.info(
        'Starting interactive elements detection from popup',
        'PopupApp'
      );

      const tab = await getCurrentTab();

      // Send message to content script to execute the detection
      await browser.tabs.sendMessage(tab.id!, {
        type: 'LIST_INTERACTIVE_ELEMENTS',
      });

      setStatus('Interactive elements logged to console');

      // Clear status after 2 seconds
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      logger.logError(error as Error, 'PopupApp');
      setStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div
      className={`w-[360px] h-fit max-h-[600px] gradient-jotform text-white font-sans flex flex-col ${EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS}`}
    >
      <PopupHeader />

      <div className="flex-1 p-5">
        <div className="mb-5">
          <p className="m-0 text-sm leading-relaxed opacity-90">
            {PromptMessages.getAll().EXTENSION_DESCRIPTION}
          </p>
        </div>

        <StatusMessage status={status} />

        <ActionButtons
          isExecuting={false}
          onListInteractiveElements={listInteractiveElements}
        />
      </div>

      <PopupFooter />
    </div>
  );
}

export default App;
