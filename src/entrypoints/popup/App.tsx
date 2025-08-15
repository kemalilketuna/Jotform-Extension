import React from 'react';
import jotformLogo from '@/assets/jotform-logo.svg';
import './App.css';

function App() {
  const createForm = async () => {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.id) {
        // Navigate the current tab to the Jotform workspace
        await chrome.tabs.update(tab.id, { url: 'https://www.jotform.com/workspace/' });

        // Close the popup
        window.close();
      }
    } catch (error) {
      console.error('Navigation failed:', error);
      // Fallback: open in new tab if current tab navigation fails
      chrome.tabs.create({ url: 'https://www.jotform.com/workspace/' });
      window.close();
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

        <div className="controls">
          <button className="create-form-btn" onClick={createForm}>
            Create Form
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
