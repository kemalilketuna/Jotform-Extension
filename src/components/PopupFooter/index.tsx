import React from 'react';
import styles from '@/styles/extension.module.css';

/**
 * Footer component for the popup with branding text
 */
export const PopupFooter: React.FC = () => {
  return (
    <footer className={styles.popupFooter}>
      <p className={styles.popupFooterText}>
        Powered by AI • Built for JotForm
      </p>
    </footer>
  );
};

export default PopupFooter;
