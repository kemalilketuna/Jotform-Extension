import React from 'react';

/**
 * Footer component for the popup with branding text
 */
export const PopupFooter: React.FC = () => {
  return (
    <footer className="!p-4 !border-t !border-white/20 !text-center">
      <p className="!m-0 !text-xs !text-white/70">
        Powered by AI • Built for JotForm
      </p>
    </footer>
  );
};

export default PopupFooter;
