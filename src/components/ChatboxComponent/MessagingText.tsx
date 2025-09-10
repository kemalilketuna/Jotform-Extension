import React from 'react';

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
    ...style,
  };

  return (
    <div className={`leading-6 font-sans ${className}`} style={defaultStyle}>
      {message}
    </div>
  );
};
