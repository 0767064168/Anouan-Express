import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthPrimaryButton({
  children,
  loading = false,
  disabled = false,
  className = '',
  type = 'submit',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-slate-950 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 text-sm uppercase tracking-wider ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
}
