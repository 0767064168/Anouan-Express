import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  gradient,
  iconBg,
  border,
  className = '',
}) {
  return (
    <div
      className={`relative bg-gradient-to-br ${gradient} border ${border} rounded-3xl p-6 overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-xl ${className}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-2xl border ${iconBg}`}>
          {Icon && <Icon size={20} />}
        </div>

        {change && (
          <span
            className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'bg-red-500/15 text-red-400 border border-red-500/25'
            }`}
          >
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
        )}
      </div>

      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-black text-white mt-1 leading-tight">{value}</p>
    </div>
  );
}
