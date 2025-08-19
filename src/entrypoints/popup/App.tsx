import React, { useState } from 'react';
import jotformLogo from '@/assets/jotform-logo.svg';
import { AutomationServerService } from '../../services/AutomationServerService';
import { ExecuteSequenceMessage } from '../../types/AutomationTypes';
import { LoggingService } from '../../services/LoggingService';
import { UserMessages } from '../../constants/UserMessages';
import { NavigationUrls } from '../../constants/NavigationUrls';
import { ContentScriptError } from '../../errors/AutomationErrors';
import './App.css';

/**
 * Main popup component for the JotForm extension
 */
function App() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const logger = LoggingService.getInstance();

  /**
   * Handle form creation automation
   */
  const createForm = async () => {
    if (isExecuting) return;

    try {
      setIsExecuting(true);
      setStatus(UserMessages.STATUS.STARTING_AUTOMATION);
      logger.info('Starting form creation from popup', 'PopupApp');

      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error(UserMessages.ERRORS.NO_ACTIVE_TAB);
      }

      // Check if we're on a Jotform page
      if (!tab.url || !NavigationUrls.isJotformUrl(tab.url)) {
        setStatus(UserMessages.STATUS.NAVIGATING_TO_WORKSPACE);
        await chrome.tabs.update(tab.id, { url: NavigationUrls.WORKSPACE });

        // Wait for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      setStatus(UserMessages.STATUS.FETCHING_FROM_SERVER);

      // Get automation steps from server
      const serverService = AutomationServerService.getInstance();
      const serverResponse = await serverService.fetchFormCreationSteps();

      setStatus(UserMessages.STATUS.CONVERTING_RESPONSE);
      const sequence = serverService.convertToAutomationSequence(serverResponse);

      setStatus(UserMessages.STATUS.PREPARING_SEQUENCE);

      // Wait a moment for content script to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send automation sequence to content script
      const message: ExecuteSequenceMessage = {
        type: 'EXECUTE_SEQUENCE',
        payload: sequence
      };

      setStatus(UserMessages.STATUS.EXECUTING_SEQUENCE);

      try {
        const response = await chrome.tabs.sendMessage(tab.id, message);
        console.log('Response from content script:', response);

        if (response && response.type === 'SEQUENCE_COMPLETE') {
          setStatus(UserMessages.SUCCESS.FORM_CREATION_COMPLETE);
          logger.info('Form creation completed successfully', 'PopupApp');
        } else if (response && response.type === 'SEQUENCE_ERROR') {
          throw new Error(response.payload?.error || UserMessages.ERRORS.AUTOMATION_TIMEOUT);
        } else {
          setStatus(UserMessages.SUCCESS.FORM_CREATION_COMPLETE);
        }
      } catch (messageError: any) {
        // If content script is not available, try injecting it
        if (messageError.message?.includes('Receiving end does not exist')) {
          setStatus(UserMessages.STATUS.INJECTING_CONTENT_SCRIPT);
          logger.warn('Content script not available, attempting injection', 'PopupApp');

          try {
            // Try to inject the content script manually
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content-scripts/content.js']
            });

            // Wait for script to load
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Retry the message
            setStatus(UserMessages.STATUS.RETRYING_AUTOMATION);
            const response = await chrome.tabs.sendMessage(tab.id, message);

            if (response && response.type === 'SEQUENCE_COMPLETE') {
              setStatus(UserMessages.SUCCESS.FORM_CREATION_COMPLETE);
              logger.info('Form creation completed after content script injection', 'PopupApp');
            } else if (response && response.type === 'SEQUENCE_ERROR') {
              throw new Error(response.payload?.error || UserMessages.ERRORS.AUTOMATION_TIMEOUT);
            } else {
              setStatus(UserMessages.SUCCESS.FORM_CREATION_COMPLETE);
            }
          } catch (injectionError) {
            setStatus(UserMessages.STATUS.REFRESH_PAGE_REQUIRED);
            const error = new ContentScriptError(UserMessages.ERRORS.CONTENT_SCRIPT_INJECTION_FAILED, tab.id);
            logger.logError(error, 'PopupApp');
            throw error;
          }
        } else {
          throw messageError;
        }
      }

      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);

    } catch (error) {
      logger.logError(error as Error, 'PopupApp');
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
