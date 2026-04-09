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
    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200">
      {/* Red gradient bar — same line as original */}
      <div className="bg-linear-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] px-5 py-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: icon + title + subtitle */}
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30 shrink-0">
                <Icon size={18} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-bold text-base leading-tight drop-shadow-sm uppercase">
                {title}
              </p>
              {subtitle && (
                <p className="text-white/80 text-xs mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right: Nuevo + Filtro (toggle) + extra */}
          <div className="flex flex-wrap items-center gap-2">
            {onNewClick && (
              <button
                type="button"
                onClick={onNewClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/95 border border-gray-300 text-gray-800 hover:bg-white hover:border-gray-400 text-xs font-bold uppercase shadow-sm transition-all"
              >
                <NewIcon size={14} />
                {newButtonLabel}
              </button>
            )}
            {hasFilters && (
              <button
                type="button"
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-bold uppercase transition-all ${
                  showFilters
                    ? 'bg-white border-gray-400 text-gray-800 shadow-sm'
                    : 'bg-white/95 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400'
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

      {/* Filter section — only visible when "Filtro" is toggled on */}
      {hasFilters && showFilters && (
        <div className="bg-white border-t border-gray-200 px-5 py-3">
          {filterContent}
        </div>
      )}
    </div>
  );
};

export default ModuleHeader;
