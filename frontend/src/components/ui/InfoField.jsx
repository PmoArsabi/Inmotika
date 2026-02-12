import React from 'react';
import { Label, TextSmall } from './Typography';

const InfoField = ({ label, value, icon: Icon, className = "" }) => (
  <div className={`flex flex-col gap-0.5 ${className}`}>
    <div className="flex items-center gap-1.5 text-gray-400">
      {Icon && <Icon size={12} />}
      <Label>{label}</Label>
    </div>
    <TextSmall className="text-gray-900 font-bold truncate">{value || '-'}</TextSmall>
  </div>
);

export default InfoField;
