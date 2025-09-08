import React from 'react';
import { IconAnglesUp } from '@jotforminc/svg-icons';

export interface SendIconProps {
  className?: string;
}

export const SendIcon: React.FC<SendIconProps> = ({
  className = 'w-5 h-5',
}) => {
  return <IconAnglesUp className={`fill-white ${className}`} />;
};

export default SendIcon;
