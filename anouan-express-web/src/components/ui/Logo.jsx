// src/components/ui/Logo.jsx
// Logo Officiel Anouan Express Retouché & Embelli avec Animation Pro Vectorielle

import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', showText = true, animated = true, to = '/' }) {
  // Dimensioning
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 24, text: 'text-base', subText: 'text-[9px]' },
    md: { container: 'w-10 h-10', icon: 32, text: 'text-lg', subText: 'text-[10px]' },
    lg: { container: 'w-14 h-14', icon: 44, text: 'text-2xl', subText: 'text-xs' },
    xl: { container: 'w-20 h-20', icon: 64, text: 'text-3xl', subText: 'text-sm' },
  };

  const currentSize = sizes[size] || sizes.md;

  const LogoIcon = (
    <div className={`relative ${currentSize.container} group flex items-center justify-center shrink-0`}>
      {/* Halo Lumineux d'Arrière-plan avec Animation de Pulsation */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 via-amber-400 to-emerald-500 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
      )}

      {/* Conteneur Verre / Badge */}
      <div className="relative w-full h-full rounded-2xl bg-slate-950 border border-orange-500/30 p-1.5 flex items-center justify-center shadow-xl overflow-hidden group-hover:border-orange-500/80 transition-colors">
        
        {/* Lueur de balayage au survol */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

        {/* SVG Vectoriel Retouché du Logo Anouan Express */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(249,115,22,0.5)]"
        >
          <defs>
            {/* Dégradé Arche Extérieure (Orange Chaud) */}
            <linearGradient id="orangeArchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            {/* Dégradé Arche Intérieure (Émeraude Ivoirienne) */}
            <linearGradient id="greenArchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Dégradé Éclair Express (Or & Feu) */}
            <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            {/* Filtre de lueur sur l'éclair */}
            <filter id="glowLightning" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Arche Extérieure (Orange) */}
          <path
            d="M 22 88 V 40 A 28 28 0 0 1 78 40 V 88"
            stroke="url(#orangeArchGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Arche Intérieure (Vert Émeraude) */}
          <path
            d="M 39 88 V 46 A 11 11 0 0 1 61 46 V 88"
            stroke="url(#greenArchGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Éclair Express Traversant (Orange / Or Lumineux) avec Animation */}
          <g className={animated ? 'animate-lightning-sparkle' : ''}>
            <polygon
              points="14,64 62,22 46,50 86,36 38,78 54,50"
              fill="url(#lightningGrad)"
              filter="url(#glowLightning)"
            />
          </g>
        </svg>
      </div>
    </div>
  );

  const content = (
    <div className="flex items-center gap-3 group cursor-pointer select-none">
      {LogoIcon}

      {showText && (
        <div className="flex flex-col">
          <div className={`font-black text-white ${currentSize.text} tracking-tight leading-none group-hover:text-orange-400 transition-colors`}>
            Anouan <span className="text-orange-500">Express</span>
          </div>
          <div className={`text-slate-400 font-bold uppercase tracking-widest ${currentSize.subText} mt-0.5 flex items-center gap-1`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Marketplace CI
          </div>
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}
