import React from 'react';
import { TextSmall } from './Typography';

/**
 * Reusable Tabs component with 'pills' aesthetic.
 * @param {Array} tabs - Array of strings or objects { key, label }.
 * @param {string} active - Currently active tab key/string.
 * @param {function} onChange - Callback when a tab is clicked.
 * @param {string} className - Optional container classes.
 */
const Tabs = ({ tabs, active, onChange, className = '' }) => {
  return (
    <div className={`flex gap-1 bg-gray-100 p-1 rounded-xl w-fit ${className}`}>
      {tabs.map((tab) => {
        const key = typeof tab === 'string' ? tab : tab.key;
        const label = typeof tab === 'string' ? tab : tab.label;
        const isActive = active === key;

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-6 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
              isActive 
                ? 'bg-white text-primary shadow-sm scale-[1.02]' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'
            }`}
          >
            <TextSmall className={`uppercase font-bold ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              {label}
            </TextSmall>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
