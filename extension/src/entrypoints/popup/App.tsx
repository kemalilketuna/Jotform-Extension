import React, { useState, useEffect } from 'react';
import jotformLogo from '@/assets/jotform-logo.svg';
import { AutomationServerService } from '@/services/AutomationServerService';
import { WebSocketService } from '@/services/WebSocketService';
import { AutomationSequence } from '@/services/AutomationEngine';
import { ExecuteSequenceMessage } from '@/services/AutomationEngine/MessageTypes';
import { LoggingService } from '@/services/LoggingService';
import { UserMessages } from '@/constants/UserMessages';
import { NavigationUrls } from '@/constants/NavigationUrls';
import { ElementSelectors } from '@/constants/ElementSelectors';

import './App.css';

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
  }, []);

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
    if (!tab.url || !NavigationUrls.isJotformUrl(tab.url)) {
      setStatus(UserMessages.STATUS.NAVIGATING_TO_WORKSPACE);
      await browser.tabs.update(tab.id!, { url: NavigationUrls.WORKSPACE });
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
      console.error('Force reconnection failed:', error);
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
      className={`ai-form-popup ${ElementSelectors.EXTENSION_COMPONENTS.EXTENSION_COMPONENT_CLASS}`}
    >
      <header className="popup-header">
        <img src={jotformLogo} className="logo" alt="JotForm logo" />
        <div className="header-text">
          <h1>AI-Form</h1>
          <p className="subtitle">Smart Form Assistant</p>
        </div>
      </header>

      <div className="main-content">
        <div className="description">
          <p>{UserMessages.PROMPTS.EXTENSION_DESCRIPTION}</p>
        </div>

        <div className="connection-status">
          <div className={`status-indicator ${connectionStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'open' && 'Connected'}
              {connectionStatus === 'closing' && 'Disconnecting...'}
              {connectionStatus === 'closed' && 'Disconnected'}
            </span>
          </div>
          {reconnectAttempts > 0 && (
            <div className="reconnect-info">
              <span className="reconnect-text">
                Reconnection attempts: {reconnectAttempts}
              </span>
            </div>
          )}
          {connectionError && (
            <div className="connection-error">
              <span className="error-text">{connectionError}</span>
              <button
                className="reconnect-btn"
                onClick={handleForceReconnect}
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Retry Connection'}
              </button>
            </div>
          )}
        </div>

        {status && (
          <div className="status-message">
            <p>{status}</p>
          </div>
        )}

        <div className="controls">
          <button
            className={`create-form-btn ${isExecuting ? 'executing' : ''} ${!isConnected ? 'disabled' : ''}`}
            onClick={createForm}
            disabled={isExecuting || !isConnected}
            title={!isConnected ? 'Connect to server first' : ''}
          >
            {isExecuting ? 'Creating...' : 'Create Form'}
          </button>
          <button
            className={`build-form-btn ${isExecuting ? 'executing' : ''} ${!isConnected ? 'disabled' : ''}`}
            onClick={buildForm}
            disabled={isExecuting || !isConnected}
            title={!isConnected ? 'Connect to server first' : ''}
          >
            {isExecuting ? 'Building...' : 'Build Form'}
          </button>
        </div>
      </div>

      <footer className="popup-footer">
        <p>Powered by AI • Built for JotForm</p>
      </footer>
    </div>
  );
}

export default App;
