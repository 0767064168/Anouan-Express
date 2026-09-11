import React from 'react';

export default function PasswordStrengthMeter({ password = '' }) {
  const getStrength = (value) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (!value) return { score: 0, label: 'Aucune' };
    if (score <= 1) return { score: 1, label: 'Faible' };
    if (score === 2) return { score: 2, label: 'Moyen' };
    if (score === 3) return { score: 3, label: 'Fort' };
    return { score: 4, label: 'Très fort' };
  };

  const strength = getStrength(password);

  const colorClass =
    strength.score <= 1
      ? 'text-red-400'
      : strength.score === 2
        ? 'text-yellow-400'
        : 'text-emerald-400';

  const barClass =
    strength.score <= 1
      ? 'w-1/4 bg-red-500'
      : strength.score === 2
        ? 'w-2/4 bg-yellow-500'
        : strength.score === 3
          ? 'w-3/4 bg-emerald-500'
          : 'w-full bg-emerald-400';

  return (
    <div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>Force du mot de passe</span>
        <span className={colorClass}>{strength.label}</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barClass}`} />
      </div>
    </div>
  );
}
