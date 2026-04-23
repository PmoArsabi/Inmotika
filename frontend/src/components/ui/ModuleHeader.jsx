import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';

const ModuleHeader = ({
  title,
  subtitle,
  icon: Icon,
  onNewClick,
  newButtonLabel = 'Nuevo',
  newButtonIcon: NewIcon = Plus,
  extraActions,
  filterContent,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasFilters = !!filterContent;

  return (
    <div className="rounded-2xl overflow-hidden shadow-(--shadow-card)">
      <div className="bg-linear-to-r from-brand via-brand-dark to-brand-deeper px-5 py-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 shrink-0">
                <Icon size={18} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-base leading-tight drop-shadow-sm">
                {title}
              </p>
              {subtitle && (
                <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNewClick && (
              <button
                type="button"
                onClick={onNewClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 text-gray-800 hover:bg-white text-xs font-semibold shadow-sm transition-all duration-(--transition-smooth)"
              >
                <NewIcon size={14} />
                {newButtonLabel}
              </button>
            )}
            {hasFilters && (
              <button
                type="button"
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-(--transition-smooth) ${
                  showFilters
                    ? 'bg-white border-white/60 text-gray-800 shadow-sm'
                    : 'bg-white/90 border-white/30 text-gray-700 hover:bg-white'
                }`}
              >
                <Filter size={14} />
                Filtro
              </button>
            )}
            {extraActions}
          </div>
        </div>
      </div>

      {hasFilters && showFilters && (
        <div className="bg-white border-t border-gray-100/80 px-5 py-3">
          {filterContent}
        </div>
      )}
    </div>
  );
};

export default ModuleHeader;
