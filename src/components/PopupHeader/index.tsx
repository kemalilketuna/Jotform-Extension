import React from 'react';
import jotformLogo from '@/assets/jotformLogo.svg';
import styles from '@/styles/extension.module.css';

/**
 * Header component for the popup with logo and title
 */
export const PopupHeader: React.FC = () => {
  return (
    <header className={styles.popupHeader}>
      <img
        src={jotformLogo}
        className={styles.popupHeaderLogo}
        alt="JotForm logo"
      />
      <div className={styles.popupHeaderContent}>
        <h1 className={styles.popupHeaderTitle}>AI-Form</h1>
        <p className={styles.popupHeaderSubtitle}>Smart Form Assistant</p>
      </div>
    </header>
  );
};

export default PopupHeader;
