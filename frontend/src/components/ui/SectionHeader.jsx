import React from 'react';
import { H2, Subtitle } from './Typography';

/**
 * Encabezado de sección reutilizable.
 * @param {{ title: string, subtitle?: string, className?: string, rightContent?: React.ReactNode, icon?: React.ElementType }} props
 */
const SectionHeader = ({ title, subtitle, className = "", rightContent = null, icon: Icon = null }) => (
  <header className={`mb-4 flex items-end justify-between ${className}`}>
    <div className="flex items-center gap-2">
      {Icon && (
        <div className="p-1.5 bg-gray-100 rounded-lg shrink-0">
          <Icon size={14} className="text-gray-600" />
        </div>
      )}
      <div>
        <H2 className="mb-1">{title}</H2>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </div>
    </div>
    {rightContent && <div>{rightContent}</div>}
  </header>
);

export default SectionHeader;
