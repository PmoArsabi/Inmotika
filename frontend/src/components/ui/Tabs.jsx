import React from 'react';

/**
 * Tabs — Segmented Control con pastilla deslizante animada (spring).
 *
 * @param {Array<string|{key:string, label:string, shortLabel?:string}>} tabs
 * @param {string}   active    — clave del tab activo
 * @param {Function} onChange  — callback(key)
 * @param {string}   [className]
 */
const Tabs = ({ tabs, active, onChange, className = '' }) => {
  const activeIndex = tabs.findIndex((t) => (typeof t === 'string' ? t : t.key) === active);
  const count = tabs.length;

  return (
    <div className={`relative flex bg-gray-100/80 p-1 rounded-2xl w-full ${className}`}>
      {/* Pastilla deslizante — hardware-accelerated via transform */}
      {activeIndex >= 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 rounded-xl bg-white shadow-(--shadow-card) pointer-events-none transition-transform duration-(--transition-spring)"
          style={{
            width: `${100 / count}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      )}

      {tabs.map((tab) => {
        const key        = typeof tab === 'string' ? tab : tab.key;
        const label      = typeof tab === 'string' ? tab : tab.label;
        const shortLabel = typeof tab === 'string' ? tab : (tab.shortLabel || label);
        const isActive   = active === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={[
              'relative z-10 flex-1 px-3 py-2 rounded-xl text-xs leading-tight select-none',
              'transition-colors duration-(--transition-base)',
              isActive ? 'text-ink font-semibold' : 'text-ink-muted font-medium hover:text-ink-secondary',
            ].join(' ')}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
