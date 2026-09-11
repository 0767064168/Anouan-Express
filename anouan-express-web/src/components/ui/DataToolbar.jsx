import React from 'react';
import { Search, X } from 'lucide-react';

export default function DataToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  onReset,
  hasActiveFilters = false,
  children,
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {children}

        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 text-xs text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1 font-bold"
          >
            <X size={13} /> Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
