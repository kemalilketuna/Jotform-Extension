import React from 'react';
import { PodoLogoStrings } from './PodoLogoStrings';
import { ServiceFactory } from '@/services/DIContainer';
import styles from '@/styles/extension.module.css';

export interface PodoLogoProps {
  className?: string;
  size?: keyof typeof PodoLogoStrings.SIZE_CLASSES;
}

export const PodoLogo: React.FC<PodoLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const getImageSrc = () => {
    // Use chrome.runtime.getURL for proper extension asset access
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(PodoLogoStrings.ASSET_PATHS.LOGO_IMAGE);
    }
    // Fallback for development/non-extension contexts
    return `/${PodoLogoStrings.ASSET_PATHS.LOGO_IMAGE}`;
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return styles.logoSm;
      case 'lg':
        return styles.logoLg;
      default:
        return styles.logoMd;
    }
  };

  return (
    <div className={`${styles.logoContainer} ${getSizeClass()} ${className}`}>
      <img
        src={getImageSrc()}
        alt={PodoLogoStrings.ALT_TEXT.LOGO}
        className={styles.logoImage}
        onError={(e) => {
          ServiceFactory.getInstance()
            .createLoggingService()
            .error('Failed to load Podo logo', 'PodoLogo', {
              error: e.type,
            });
          // Hide the image container if loading fails
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
};

export default PodoLogo;
export { PodoLogoStrings } from './PodoLogoStrings';
