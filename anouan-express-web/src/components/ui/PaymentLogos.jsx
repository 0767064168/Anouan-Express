// src/components/ui/PaymentLogos.jsx
// Logos officiels vectoriels des moyens de paiement en Côte d'Ivoire (Orange Money, MTN MoMo, Wave, Espèces)

import React from 'react';

export function OrangeMoneyLogo({ size = 32, className = '' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-2xl overflow-hidden shadow-md shrink-0 flex items-center justify-center ${className}`}
    >
      <img
        src="/logos/orange-money.svg"
        alt="Orange Money"
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export function MtnMomoLogo({ size = 32, className = '' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-2xl overflow-hidden shadow-md shrink-0 flex items-center justify-center ${className}`}
    >
      <img
        src="/logos/mtn-momo.svg"
        alt="MTN MoMo"
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export function WaveLogo({ size = 32, className = '' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-2xl overflow-hidden shadow-md shrink-0 flex items-center justify-center ${className}`}
    >
      <img
        src="/logos/wave.svg"
        alt="Wave Digital"
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export function CashLogo({ size = 32, className = '' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-2xl overflow-hidden shadow-md shrink-0 flex items-center justify-center ${className}`}
    >
      <img
        src="/logos/cash.svg"
        alt="Payer au retrait"
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export function PaymentLogo({ provider, size = 32, className = '' }) {
  switch (provider) {
    case 'orange':
      return <OrangeMoneyLogo size={size} className={className} />;
    case 'mtn':
      return <MtnMomoLogo size={size} className={className} />;
    case 'wave':
      return <WaveLogo size={size} className={className} />;
    case 'cash':
      return <CashLogo size={size} className={className} />;
    default:
      return null;
  }
}

/**
 * Barre complète des moyens de paiement sécurisés avec logos
 */
export function PaymentMethodsRow({ size = 28, showLabel = true, className = '' }) {
  const methods = [
    { id: 'orange', name: 'Orange Money', Component: OrangeMoneyLogo, border: 'border-orange-500/30' },
    { id: 'mtn',    name: 'MTN MoMo',      Component: MtnMomoLogo,     border: 'border-yellow-500/30' },
    { id: 'wave',   name: 'Wave',          Component: WaveLogo,        border: 'border-sky-500/30' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {methods.map(({ id, name, Component, border }) => (
        <div
          key={id}
          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border ${border} shadow-sm`}
        >
          <Component size={size} />
          {showLabel && <span className="text-xs font-bold text-white tracking-wide">{name}</span>}
        </div>
      ))}
    </div>
  );
}

export default PaymentLogo;
