import React from 'react';
import { Subtitle } from './Typography';

/**
 * Table — wraps a <table> with horizontal scroll.
 * The last column (th:last-child / td:last-child) is automatically
 * shrunk to content width so action icon columns never get extra space.
 */
export const Table = ({ children }) => (
  <div className="w-full overflow-x-auto">
    <table className="w-full border-collapse table-auto [&_th:last-child]:w-px [&_th:last-child]:whitespace-nowrap [&_td:last-child]:w-px [&_td:last-child]:whitespace-nowrap">
      {children}
    </table>
  </div>
);

export const THead = ({ children, variant = "light", className = "" }) => (
  (() => {
    const isDark = variant === 'dark';
    const defaultVarClassName = isDark ? '[--table-head-text:#E5E7EB]' : '[--table-head-text:#9CA3AF]';
    const defaultRowClassName = isDark
      ? `border-b border-white/10 bg-[#1A1A1A] ${defaultVarClassName}`
      : `border-b border-gray-100 bg-gray-50/50 ${defaultVarClassName}`;

    const childArray = React.Children.toArray(children);
    const hasTrChild = childArray.some(
      (child) => React.isValidElement(child) && child.type === 'tr'
    );

    if (hasTrChild) {
      return (
        <thead>
          {childArray.map((child, idx) => {
            if (!React.isValidElement(child) || child.type !== 'tr') return child;
            const mergedClassName = [defaultRowClassName, className, child.props.className].filter(Boolean).join(' ');
            return React.cloneElement(child, { className: mergedClassName, key: child.key ?? idx });
          })}
        </thead>
      );
    }

    return (
      <thead>
        <tr className={[defaultRowClassName, className].filter(Boolean).join(' ')}>
          {children}
        </tr>
      </thead>
    );
  })()
);

export const TBody = ({ children, className = "" }) => (
  <tbody className={`**:normal-case! ${className}`}>
    {children}
  </tbody>
);

export const Tr = ({ children, onClick, className = "" }) => (
  <tr
    onClick={onClick}
    className={`border-b border-gray-50 last:border-none transition-colors hover:bg-gray-50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

export const Th = ({ children, narrow = false, className = "" }) => (
  <th className={`py-3 px-5 text-left ${narrow ? 'w-px whitespace-nowrap' : ''} ${className}`}>
    <Subtitle className="text-(--table-head-text)">{children}</Subtitle>
  </th>
);

export const Td = ({ children, narrow = false, className = "" }) => (
  <td className={`py-3 px-5 text-left ${narrow ? 'w-px whitespace-nowrap' : ''} ${className}`}>
    <div className="text-[11px] font-medium text-gray-700">
      {children}
    </div>
  </td>
);
