import React, { useState, useEffect } from 'react';
import { AutomationServerService } from '@/services/AutomationServerService';
import { WebSocketService } from '@/services/WebSocketService';
import { AutomationSequence } from '@/services/ActionsService/ActionTypes';
import { ExecuteSequenceMessage } from '@/services/AutomationEngine/MessageTypes';
import { LoggingService } from '@/services/LoggingService';
import { UserMessages } from '@/services/MessagesService';
import { NavigationUtils } from '@/utils';
import { EXTENSION_COMPONENTS } from '@/services/UserInteractionBlocker';
import { PopupHeader } from '@/components/PopupHeader';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { StatusMessage } from '@/components/StatusMessage';
import { ActionButtons } from '@/components/ActionButtons';
import { PopupFooter } from '@/components/PopupFooter';

/**
 * Main popup component for the JotForm extension
 */
function App() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'open' | 'closing' | 'closed'
  >('closed');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const logger = LoggingService.getInstance();
  const webSocketService = WebSocketService.getInstance();

  /**
   * Initialize WebSocket connection on component mount
   */
  useEffect(() => {
    // Add connection state listener
    const handleConnectionStateChange = (state: string, error?: Error) => {
      setIsConnected(state === 'connected');
      setConnectionStatus(webSocketService.getConnectionStatus());
      setConnectionError(error?.message || null);

      const detailedState = webSocketService.getDetailedConnectionState();
      setReconnectAttempts(detailedState.reconnectAttempts);
    };

    webSocketService.addConnectionListener(handleConnectionStateChange);

    const initializeConnection = async () => {
      try {
        setStatus('Connecting to automation server...');
        setConnectionStatus('connecting');

        await AutomationServerService.connect();

        setIsConnected(true);
        setConnectionStatus('open');
        setStatus('Connected to automation server');

        // Clear status after 2 seconds
        setTimeout(() => setStatus(''), 2000);
      } catch (error) {
        logger.logError(error as Error, 'PopupApp');
        setIsConnected(false);
        setConnectionStatus('closed');
        setStatus('Failed to connect to automation server');
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      webSocketService.removeConnectionListener(handleConnectionStateChange);
      AutomationServerService.disconnect();
    };
  }, [logger, webSocketService]);

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
   * Fetch automation sequence from WebSocket server
   */
  const fetchAutomationSequence = async () => {
    if (!isConnected) {
      const health = webSocketService.getConnectionHealth();
      throw new Error(
        `Not connected to automation server. Issues: ${health.issues.join(', ')}`
      );
    }

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
   * Fetch form building automation sequence from WebSocket server
   */
  const fetchFormBuildingSequence = async () => {
    if (!isConnected) {
      const health = webSocketService.getConnectionHealth();
      throw new Error(
        `Not connected to automation server. Issues: ${health.issues.join(', ')}`
      );
    }

    setStatus('Fetching form building steps from server...');
    const response = await AutomationServerService.fetchFormBuildingSteps();

    setStatus('Converting server response...');
    return AutomationServerService.convertToAutomationSequence(response);
  };

  /**
   * Handle force reconnection
   */
  const handleForceReconnect = async () => {
    try {
      setConnectionError(null);
      await webSocketService.forceReconnect();
    } catch (error) {
      logger.logError(
        error instanceof Error ? error : new Error('Force reconnection failed'),
        'App'
      );
      setConnectionError(
        error instanceof Error ? error.message : 'Reconnection failed'
      );
    }
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

        <ConnectionStatus
          connectionStatus={connectionStatus}
          reconnectAttempts={reconnectAttempts}
          connectionError={connectionError}
          onForceReconnect={handleForceReconnect}
        />

        <StatusMessage status={status} />

        <ActionButtons
          isExecuting={isExecuting}
          isConnected={isConnected}
          onCreateForm={createForm}
          onBuildForm={buildForm}
        />
      </div>

      <PopupFooter />
    </div>
  );
}

export default App;
