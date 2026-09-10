// src/components/ui/Toast.jsx
// Système de notifications toast premium dark orange

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: CheckCircle2, cls: 'text-emerald-400',  bar: 'bg-emerald-500', bg: 'border-emerald-500/20' },
  error:   { icon: AlertCircle,  cls: 'text-red-400',     bar: 'bg-red-500',     bg: 'border-red-500/20'     },
  warning: { icon: AlertTriangle,cls: 'text-amber-400',   bar: 'bg-amber-500',   bg: 'border-amber-500/20'   },
  info:    { icon: Info,         cls: 'text-blue-400',    bar: 'bg-blue-500',    bg: 'border-blue-500/20'     },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
  }, []);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type, leaving: false }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience methods
  toast.success = (msg, d) => toast(msg, 'success', d);
  toast.error   = (msg, d) => toast(msg, 'error',   d);
  toast.warning = (msg, d) => toast(msg, 'warning', d);
  toast.info    = (msg, d) => toast(msg, 'info',    d);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => {
          const cfg = ICONS[t.type] || ICONS.info;
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 bg-slate-900/95 backdrop-blur-xl border ${cfg.bg} border-slate-800 rounded-2xl shadow-2xl shadow-black/40 transition-all duration-350 ${
                t.leaving ? 'opacity-0 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'
              }`}
            >
              {/* Progress bar */}
              <div className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} rounded-full opacity-60`}
                style={{ width: '100%', animation: 'shrink 4s linear forwards' }}/>

              <div className={`shrink-0 mt-0.5 ${cfg.cls}`}><Icon size={16}/></div>
              <p className="flex-1 text-xs font-semibold text-white leading-relaxed">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="shrink-0 text-slate-500 hover:text-white transition-colors mt-0.5">
                <X size={14}/>
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider');
  return ctx;
}
