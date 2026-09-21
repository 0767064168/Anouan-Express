// src/components/client/FlashSaleCountdown.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';

export default function FlashSaleCountdown({ compact = false, className = '' }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diff = Math.max(0, endOfDay.getTime() - now.getTime());
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, mins, secs });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 px-3 py-1.5 rounded-xl text-orange-400 font-mono text-xs font-black shadow-sm ${className}`}>
        <Zap size={13} className="text-amber-400 animate-pulse" />
        <span>Fin dans :</span>
        <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-orange-500/20 text-white font-black">
          {pad(timeLeft.hours)}:{pad(timeLeft.mins)}:{pad(timeLeft.secs)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 bg-slate-950/90 border border-amber-500/40 px-5 py-3 rounded-2xl shadow-2xl border-kita-glow ${className}`}>
      <Clock className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-wider font-black text-amber-400/80">Temps restant aujourd'hui</span>
        <div className="flex items-center gap-1.5 text-amber-400 font-mono font-black text-xl">
          <span className="bg-slate-900 px-2 py-1 rounded-lg border border-amber-500/20 text-white">{pad(timeLeft.hours)}</span>
          <span className="text-amber-400">:</span>
          <span className="bg-slate-900 px-2 py-1 rounded-lg border border-amber-500/20 text-white">{pad(timeLeft.mins)}</span>
          <span className="text-amber-400">:</span>
          <span className="bg-slate-900 px-2 py-1 rounded-lg border border-amber-500/20 text-amber-400 animate-pulse">{pad(timeLeft.secs)}</span>
        </div>
      </div>
    </div>
  );
}
