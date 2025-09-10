import React from 'react';
import { PodoLogoStrings } from './PodoLogoStrings';
import { ServiceFactory } from '@/services/DIContainer';

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

  return (
    <div
      className={`${PodoLogoStrings.SIZE_CLASSES[size]} ${PodoLogoStrings.CSS_CLASSES.CONTAINER_BASE} ${className}`}
    >
      <img
        src={getImageSrc()}
        alt={PodoLogoStrings.ALT_TEXT.LOGO}
        className={PodoLogoStrings.CSS_CLASSES.IMAGE}
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
