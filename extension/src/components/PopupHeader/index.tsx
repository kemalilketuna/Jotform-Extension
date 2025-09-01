import React from 'react';
import jotformLogo from '@/assets/jotformLogo.svg';

/**
 * Header component for the popup with logo and title
 */
export const PopupHeader: React.FC = () => {
  return (
    <header className="popup-header">
      <img src={jotformLogo} className="logo" alt="JotForm logo" />
      <div className="header-text">
        <h1>AI-Form</h1>
        <p className="subtitle">Smart Form Assistant</p>
      </div>
    </header>
  );
};

export default PopupHeader;
