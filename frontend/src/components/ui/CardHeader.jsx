import React from 'react';
import { Label } from './Typography';

const CardHeader = ({ icon: Icon, title, className = "" }) => {
  return (
    <div className={`flex items-center gap-2 text-[#D32F2F] border-b border-gray-100 pb-2 ${className}`}>
      {Icon && <Icon size={16} />}
      <Label className="text-[#D32F2F]">{title}</Label>
    </div>
  );
};

export default CardHeader;
