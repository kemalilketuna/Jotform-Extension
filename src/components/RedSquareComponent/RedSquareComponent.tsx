import React from 'react';

/**
 * Red square component that appears when the extension is active
 */
export interface RedSquareComponentProps {
  onClick?: () => void;
  className?: string;
}

export const RedSquareComponent: React.FC<RedSquareComponentProps> = ({
  onClick,
  className = '',
}) => {
  const handleClick = () => {
    console.log('Red square clicked');
    onClick?.();
  };

  return (
    <div
      id="jotform-extension-red-square"
      className={`fixed bottom-5 right-5 w-12 h-12 bg-red-500 border-2 border-red-600 rounded cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-red-600 shadow-lg z-[999999] pointer-events-auto ${className}`}
      onClick={handleClick}
      title="Jotform Extension Active"
    />
  );
};

export default RedSquareComponent;