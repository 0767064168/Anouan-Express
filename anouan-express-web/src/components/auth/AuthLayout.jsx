import React from 'react';

export default function AuthLayout({ logo, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {logo && <div className="flex justify-center mb-8">{logo}</div>}

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {children}
          {footer && <div className="px-8 py-4 bg-slate-950/60 border-t border-slate-800">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
