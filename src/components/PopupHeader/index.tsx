import React from 'react';
import jotformLogo from '@/assets/jotformLogo.svg';

/**
 * Header component for the popup with logo and title
 */
export const PopupHeader: React.FC = () => {
  return (
    <header className="flex items-center p-5 backdrop-blur-glass border-b border-white/20">
      <img
        src={jotformLogo}
        className="h-10 w-10 mr-4 rounded-lg"
        alt="JotForm logo"
      />
      <div className="flex flex-col">
        <h1 className="m-0 text-2xl font-bold text-white">AI-Form</h1>
        <p className="m-0 text-sm opacity-90 font-normal">
          Smart Form Assistant
        </p>
      </div>
    </header>
  );
};

export default PopupHeader;
