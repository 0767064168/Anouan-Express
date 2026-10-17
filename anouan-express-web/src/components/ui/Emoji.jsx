// src/components/ui/Emoji.jsx
// Rendu natif des emojis pour éviter les requêtes vers un CDN tiers.

import React from 'react';

/**
 * <Emoji e="🔥" size={20} className="..." />
 * 
 * Props:
 *  - e        : string  — l'emoji unicode (ex: "🔥", "✅", "🇨🇮")
 *  - size     : number  — taille en px (défaut: 20)
 *  - className: string  — classes Tailwind additionnelles
 *  - alt      : string  — texte alternatif pour l'accessibilité
 */
const Emoji = ({ e, size = 20, className = '', alt = '' }) => {
  if (!e) return null;

  return (
    <span
      role="img"
      aria-label={alt || e}
      className={`inline-block align-middle select-none ${className}`}
      style={{ fontSize: size, lineHeight: 1 }}
    >
      {e}
    </span>
  );
};

export default Emoji;
