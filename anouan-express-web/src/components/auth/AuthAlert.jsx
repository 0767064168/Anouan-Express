import React from 'react';

export default function AuthAlert({ children, variant = 'error' }) {
  const variants = {
    error: 'bg-red-500/10 border-red-500/25 text-red-400',
    success: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
    info: 'bg-orange-500/10 border-orange-500/25 text-orange-300',
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`mb-4 p-3 border text-xs font-semibold rounded-2xl ${variants[variant] || variants.error}`}
    >
      {children}
    </div>
  );
}
