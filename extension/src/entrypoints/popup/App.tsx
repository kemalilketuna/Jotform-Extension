import React, { useState, useEffect } from 'react';
import { AutomationServerService } from '@/services/AutomationServerService';
import { AutomationSequence } from '@/services/ActionsService/ActionTypes';
import { ExecuteSequenceMessage } from '@/services/AutomationEngine/MessageTypes';
import { LoggingService } from '@/services/LoggingService';
import { UserMessages } from '@/services/MessagesService';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { NavigationUtils } from '@/utils/NavigationUtils';
// DOMDetectionService is not used in this file
// import { DOMDetectionService } from '@/services/DOMDetectionService';
import { PopupHeader } from '@/components/PopupHeader';
import { StatusMessage } from '@/components/StatusMessage';
import { ActionButtons } from '@/components/ActionButtons';
import { PopupFooter } from '@/components/PopupFooter';

/**
 * Main popup component for the JotForm extension
 */
function App() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isConnected, setIsConnected] = useState(true); // Always connected since WebSockets are removed
  const logger = LoggingService.getInstance();

  /**
   * Initialize component state on mount
   * WebSockets have been removed, so we set connected state directly
   */
  useEffect(() => {
    // Set connected state directly since WebSockets are removed
    setIsConnected(true);

    const initializeConnection = async () => {
      try {
        setStatus('Initializing automation...');

        // This now uses the mock implementation
        await AutomationServerService.connect();

        setIsConnected(true);
        setStatus('Automation ready');

        // Clear status after 2 seconds
        setTimeout(() => setStatus(''), 2000);
      } catch (error) {
        logger.logError(error as Error, 'PopupApp');
        // Even if there's an error, we show as connected since WebSockets are disabled
        setIsConnected(true);
        setStatus('');
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      // No WebSocket listeners to remove since WebSockets are removed
      AutomationServerService.disconnect();
    };
  }, [logger]);

  /**
   * Get the current active tab
   */
  const getCurrentTab = async () => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.id) {
      throw new Error(UserMessages.ERRORS.NO_ACTIVE_TAB);
    }

    return tab;
  };

  /**
   * Navigate to JotForm workspace if not already there
   */
  const ensureJotformPage = async (tab: chrome.tabs.Tab) => {
    if (!tab.url || !NavigationUtils.isJotformUrl(tab.url)) {
      setStatus(UserMessages.STATUS.NAVIGATING_TO_WORKSPACE);
      await browser.tabs.update(tab.id!, { url: NavigationUtils.WORKSPACE });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  };

  /**
   * Fetch automation sequence (now using mock data)
   */
  const fetchAutomationSequence = async () => {
    // WebSocket connection check is no longer needed as we're always "connected"
    // with the mock implementation

    setStatus(UserMessages.STATUS.FETCHING_FROM_SERVER);
    const response = await AutomationServerService.fetchFormCreationSteps();

    setStatus(UserMessages.STATUS.CONVERTING_RESPONSE);
    return AutomationServerService.convertToAutomationSequence(response);
  };

  /**
   * Execute automation sequence via background script
   */
  const executeAutomationSequence = async (sequence: AutomationSequence) => {
    setStatus(UserMessages.STATUS.PREPARING_SEQUENCE);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const message: ExecuteSequenceMessage = {
      type: 'EXECUTE_SEQUENCE',
      payload: sequence,
    };

    setStatus(UserMessages.STATUS.EXECUTING_SEQUENCE);

    try {
      const response = await browser.runtime.sendMessage(message);

      if (response && response.type === 'SEQUENCE_COMPLETE') {
        setStatus(UserMessages.SUCCESS.FORM_CREATION_COMPLETE);
        logger.info('Form creation completed successfully', 'PopupApp');
      } else if (response && response.type === 'SEQUENCE_ERROR') {
        throw new Error(
          response.payload?.error || UserMessages.ERRORS.AUTOMATION_TIMEOUT
        );
      } else {
        setStatus(UserMessages.SUCCESS.FORM_CREATION_COMPLETE);
      }
    } catch (messageError: unknown) {
      logger.logError(messageError as Error, 'PopupApp');
      throw messageError;
    }
  };

  /**
   * Handle form creation automation
   */
  const createForm = async () => {
    if (isExecuting) return;

    try {
      setIsExecuting(true);
      setStatus(UserMessages.STATUS.STARTING_AUTOMATION);
      logger.info('Starting form creation from popup', 'PopupApp');

      const tab = await getCurrentTab();
      await ensureJotformPage(tab);
      const sequence = await fetchAutomationSequence();
      await executeAutomationSequence(sequence);

      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      logger.logError(error as Error, 'PopupApp');
      setStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsExecuting(false);
    }
  };

  /**
   * Fetch form building automation sequence (now using mock data)
   */
  const fetchFormBuildingSequence = async () => {
    // WebSocket connection check is no longer needed as we're always "connected"
    // with the mock implementation

    setStatus('Fetching form building steps...');
    const response = await AutomationServerService.fetchFormBuildingSteps();

    setStatus('Converting server response...');
    return AutomationServerService.convertToAutomationSequence(response);
  };

  /**
   * Handle form building automation
   */
  const buildForm = async () => {
    if (isExecuting) return;

    try {
      setIsExecuting(true);
      setStatus('Starting form building automation...');
      logger.info('Starting form building from popup', 'PopupApp');

      const tab = await getCurrentTab();
      await ensureJotformPage(tab);
      const sequence = await fetchFormBuildingSequence();
      await executeAutomationSequence(sequence);

      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      logger.logError(error as Error, 'PopupApp');
      setStatus(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setIsExecuting(false);
    }
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
            {UserMessages.PROMPTS.EXTENSION_DESCRIPTION}
          </p>
        </div>

        <StatusMessage status={status} />

        <ActionButtons
          isExecuting={isExecuting}
          isConnected={isConnected}
          onCreateForm={createForm}
          onBuildForm={buildForm}
          onListInteractiveElements={listInteractiveElements}
        />
      </div>

      <PopupFooter />
    </div>
  );
}

export default App;
