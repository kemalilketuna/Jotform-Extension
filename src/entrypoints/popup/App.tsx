import React, { useState } from 'react';
import jotformLogo from '@/assets/jotform-logo.svg';
import { AutomationServerService } from '@/services/AutomationServerService';
import {
  ExecuteSequenceMessage,
  AutomationSequence,
} from '@/types/AutomationTypes';
import { LoggingService } from '@/services/LoggingService';
import { UserMessages } from '@/constants/UserMessages';
import { NavigationUrls } from '@/constants/NavigationUrls';

import './App.css';

/**
 * Main popup component for the JotForm extension
 */
function App() {
  const [isExecuting, setIsExecuting] = useState(false);
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
   * Fetch automation sequence from server
   */
  const fetchAutomationSequence = async () => {
    setStatus(UserMessages.STATUS.FETCHING_FROM_SERVER);
    const serverService = AutomationServerService.getInstance();
    const serverResponse = await serverService.fetchFormCreationSteps();

    setStatus(UserMessages.STATUS.CONVERTING_RESPONSE);
    return serverService.convertToAutomationSequence(serverResponse);
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
   * Fetch form building automation sequence from server
   */
  const fetchFormBuildingSequence = async () => {
    setStatus('Fetching form building steps from server...');
    const serverService = AutomationServerService.getInstance();
    const serverResponse = await serverService.fetchFormBuildingSteps();

    setStatus('Converting server response...');
    return serverService.convertToAutomationSequence(serverResponse);
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
    <div className="ai-form-popup">
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

        {status && (
          <div className="status-message">
            <p>{status}</p>
          </div>
        )}

        <div className="controls">
          <button
            className={`create-form-btn ${isExecuting ? 'executing' : ''}`}
            onClick={createForm}
            disabled={isExecuting}
          >
            {isExecuting ? 'Creating...' : 'Create Form'}
          </button>
          <button
            className={`build-form-btn ${isExecuting ? 'executing' : ''}`}
            onClick={buildForm}
            disabled={isExecuting}
          >
            {isExecuting ? 'Building...' : 'Build Form'}
          </button>
        </div>

        <div className="features">
          <h3>{UserMessages.PROMPTS.FEATURES_TITLE}</h3>
          <ul>
            {UserMessages.PROMPTS.FEATURES_LIST.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="popup-footer">
        <p>Powered by AI • Built for JotForm</p>
      </footer>
    </div>
  );
}

export default App;
