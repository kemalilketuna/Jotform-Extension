import React, { useState } from 'react';
import jotformLogo from '@/assets/jotform-logo.svg';
import { AutomationServerService } from '../../services/AutomationServerService';
import { AutomationMessage } from '../../types/AutomationTypes';
import './App.css';

function App() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<string>('');

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

        // Wait for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
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
            className={`create-form-btn ${isExecuting ? 'executing' : ''}`}
            onClick={createForm}
            disabled={isExecuting}
          >
            {isExecuting ? 'Creating...' : 'Create Form'}
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
