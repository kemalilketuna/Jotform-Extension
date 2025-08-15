import { useState } from 'react';
import jotformLogo from '@/assets/jotform-logo.svg';
import './App.css';

function App() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState('Ready');

  const toggleExtension = () => {
    setIsEnabled(!isEnabled);
    setStatus(isEnabled ? 'Ready' : 'Active');
  };

  const openJotForm = () => {
    window.open('https://jotform.com', '_blank');
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

      <div className="status-section">
        <div className={`status-indicator ${isEnabled ? 'active' : 'inactive'}`}>
          <span className="status-dot"></span>
          <span className="status-text">Status: {status}</span>
        </div>
      </div>

      <div className="main-content">
        <div className="description">
          <p>AI-powered automation for JotForm interactions.
            Let our intelligent agent help you fill forms efficiently.</p>
        </div>

        <div className="controls">
          <button
            className={`toggle-btn ${isEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleExtension}
          >
            {isEnabled ? 'Disable AI Assistant' : 'Enable AI Assistant'}
          </button>

          <button className="secondary-btn" onClick={openJotForm}>
            Open JotForm
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
