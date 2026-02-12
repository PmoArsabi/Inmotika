import React from 'react';
import { H2, Subtitle } from './Typography';

const SectionHeader = ({ title, subtitle, className = "", rightContent = null }) => (
  <header className={`mb-4 flex items-end justify-between ${className}`}>
    <div>
      <H2 className="mb-1">{title}</H2>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </div>
    {rightContent && <div>{rightContent}</div>}
  </header>
);

export default SectionHeader;
