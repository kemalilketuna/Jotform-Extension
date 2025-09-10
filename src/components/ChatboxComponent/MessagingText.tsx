import React from 'react';

export interface MessagingTextProps {
  message?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * MessagingText component for displaying individual message text with Inter font
 */
export const MessagingText: React.FC<MessagingTextProps> = ({
  message = '',
  className = '',
  style = {},
}) => {
  const defaultStyle = {
    color: '#01105c',
    letterSpacing: '-0.176px',
    fontFamily: 'Inter',
    ...style,
  };

  return (
    <span className={`!text-base !leading-6 ${className}`} style={defaultStyle}>
      {message}
    </span>
  );
};
