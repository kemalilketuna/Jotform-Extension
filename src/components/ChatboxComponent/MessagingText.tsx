import React from 'react';
import { ComponentStrings } from './ComponentStrings';

export interface MessagingTextProps {
  message?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * MessagingText component for displaying individual message text
 */
export const MessagingText: React.FC<MessagingTextProps> = ({
  message = '',
  className = '',
  style = {},
}) => {
  const defaultStyle = {
    color: '#01105c',
    ...style,
  };

  return (
    <div
      className={`z-[2] text-base leading-6 tracking-tight-custom font-inter ${className}`}
      style={defaultStyle}
    >
      {message}
    </div>
  );
};