import React, { useState, useEffect } from 'react';
import jotformLogo from '@/assets/jotform-logo.svg';
import { AutomationServerService } from '../../services/AutomationServerService';
import { AutomationMessage } from '../../types/AutomationTypes';
import './App.css';

// Helper function to wait for content script to be ready after navigation
const waitForContentScriptReady = async (tabId: number): Promise<void> => {
  const maxAttempts = 40; // 20 seconds with 500ms intervals
  let attempts = 0;

  console.log('Waiting for content script to be ready...');

  while (attempts < maxAttempts) {
    try {
      // Try to ping the content script
      const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      if (response?.type === 'PONG') {
        console.log('Content script is ready');
        return;
      }
    } catch (error) {
      attempts++;
      console.log(`Content script not ready, attempt ${attempts}/${maxAttempts}`);

      if (attempts >= maxAttempts) {
        // Try manual injection as fallback
        console.log('Attempting manual content script injection...');
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content-scripts/content.js']
          });

          // Wait for manual injection to complete
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Try one more ping
          const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
          if (response?.type === 'PONG') {
            console.log('Content script ready after manual injection');
            return;
          }
        } catch (injectionError) {
          console.error('Manual injection failed:', injectionError);
        }

        throw new Error('Content script failed to load after navigation');
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};

function App() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [autoTriggerReady, setAutoTriggerReady] = useState(false);

  // Check for auto-trigger readiness when popup opens
  useEffect(() => {
    const checkAutoTriggerStatus = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id && tab.url?.includes('jotform.com/workspace/')) {
          setStatus('Checking if automation is ready...');

          // Give content script more time to load and detect conditions
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            try {
              const response = await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
              if (response?.type === 'PONG') {
                // Content script is ready, check auto-trigger state
                const result = await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  func: () => (window as any).jotformAutoTriggerReady || false
                });

                if (result && result[0]?.result) {
                  setAutoTriggerReady(true);
                  setStatus('Ready to create form automatically!');
                  return;
                } else {
                  // Content script is loaded but conditions not met yet
                  setStatus('Waiting for workspace to load...');
                }
                break;
              }
            } catch (error) {
              attempts++;
              if (attempts >= maxAttempts) {
                setStatus('Click "Create Form" to start automation');
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } else {
          setStatus('Navigate to JotForm to begin');
        }
      } catch (error) {
        console.error('Error checking auto-trigger status:', error);
        setStatus('Click "Create Form" to start automation');
      }
    };

    checkAutoTriggerStatus();

    // Also recheck periodically in case conditions change
    const interval = setInterval(checkAutoTriggerStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const createForm = async () => {
    if (isExecuting) return;

    try {
      setIsExecuting(true);
      setStatus('Starting form creation...');

      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Check if we're on a Jotform page
      if (!tab.url?.includes('jotform.com')) {
        setStatus('Navigating to Jotform workspace...');
        await chrome.tabs.update(tab.id, { url: 'https://www.jotform.com/workspace/' });

        // Wait for navigation to complete and content script to load
        await waitForContentScriptReady(tab.id);
      }

      setStatus('Fetching automation from server...');

      // Get automation steps from server (dummy function for now)
      const serverService = AutomationServerService.getInstance();
      const serverResponse = await serverService.fetchFormCreationSteps();

      setStatus('Converting server response to automation sequence...');
      const sequence = serverService.convertToAutomationSequence(serverResponse);

      setStatus('Preparing automation sequence...');

      // Wait a moment for content script to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send automation sequence to content script
      const message: AutomationMessage = {
        type: 'EXECUTE_SEQUENCE',
        payload: sequence
      };

      setStatus('Executing automation sequence...');

      try {
        const response = await chrome.tabs.sendMessage(tab.id, message);
        console.log('Response from content script:', response);

        if (response && response.type === 'SEQUENCE_COMPLETE') {
          setStatus('Form creation completed!');
        } else if (response && response.type === 'SEQUENCE_ERROR') {
          throw new Error(response.payload?.error || 'Automation failed');
        } else {
          setStatus('Form creation completed!');
        }
      } catch (messageError: any) {
        // If content script is not available, try injecting it
        if (messageError.message?.includes('Receiving end does not exist')) {
          setStatus('Injecting content script...');

          try {
            // Try to inject the content script manually
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content-scripts/content.js']
            });

            // Wait for script to load
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Retry the message
            setStatus('Retrying automation sequence...');
            const response = await chrome.tabs.sendMessage(tab.id, message);

            if (response && response.type === 'SEQUENCE_COMPLETE') {
              setStatus('Form creation completed!');
            } else if (response && response.type === 'SEQUENCE_ERROR') {
              throw new Error(response.payload?.error || 'Automation failed');
            } else {
              setStatus('Form creation completed!');
            }
          } catch (injectionError) {
            setStatus('Please refresh the Jotform page and try again.');
            throw new Error('Could not inject content script. Please refresh the page and try again.');
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
      console.error('Form creation failed:', error);
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
          <p>AI-powered automation for JotForm interactions.
            Let our intelligent agent help you fill forms efficiently.</p>
        </div>

        {status && (
          <div className="status-message">
            <p>{status}</p>
          </div>
        )}

        <div className="controls">
          <button
            className={`create-form-btn ${isExecuting ? 'executing' : ''} ${autoTriggerReady ? 'auto-ready' : ''}`}
            onClick={createForm}
            disabled={isExecuting}
          >
            {isExecuting ? 'Creating...' : autoTriggerReady ? 'Create Form Now' : 'Create Form'}
          </button>
        </div>

        <div className="features">
          <h3>Features:</h3>
          <ul>
            <li>🤖 Intelligent form detection</li>
            <li>📝 Automated form filling</li>
            <li>⚡ Quick form interactions</li>
            <li>🎯 Smart field recognition</li>
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
