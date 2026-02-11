import React from 'react';

export const Table = ({ children, className = "" }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full text-left">
      {children}
    </table>
  </div>
);

export const THead = ({ children, className = "" }) => (
  <thead className={`bg-[#1A1A1A] text-white ${className}`}>
    {children}
  </thead>
);

export const TBody = ({ children, className = "" }) => (
  <tbody className={`divide-y divide-gray-100 ${className}`}>
    {children}
  </tbody>
);

export const Tr = ({ children, className = "", onClick }) => (
  <tr 
    onClick={onClick}
    className={`hover:bg-gray-50 transition-colors group ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

export const Th = ({ children, className = "", align = "left" }) => {
  const alignment = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  };
  return (
    <th className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider ${alignment[align]} ${className}`}>
      {children}
    </th>
  );
};

export const Td = ({ children, className = "", align = "left" }) => {
  const alignment = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  };
  return (
    <td className={`px-4 py-3 ${alignment[align]} ${className}`}>
      {children}
    </td>
  );
};
