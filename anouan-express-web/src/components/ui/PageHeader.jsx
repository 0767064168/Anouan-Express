import React from 'react';

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  eyebrowIcon: EyebrowIcon,
  className = '',
}) {
  return (
    <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800 pb-6 ${className}`}>
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">
            {EyebrowIcon && <EyebrowIcon size={15} className="animate-pulse" />}
            {eyebrow}
          </div>
        )}
        {title && <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>}
        {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
