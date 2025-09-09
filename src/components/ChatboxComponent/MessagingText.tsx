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
    fontSize: '16px',
    lineHeight: '24px',
    letterSpacing: '-0.176px',
    fontFamily: 'Inter',
    ...style,
  };

  return (
    <div
      className={`leading-6 ${className}`}
      style={defaultStyle}
    >
      {message}
    </div>
  );
};