// src/components/ui/Emoji.jsx
// Composant emoji ultra-pro : rendu via images Twemoji (CDN jsDelivr)
// Identique sur Android, iOS, Windows — aucune variation système

import React from 'react';

/**
 * Convertit un emoji unicode en code point hexadécimal pour Twemoji CDN
 */
const emojiToCodePoint = (emoji) => {
  const codePoints = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp !== 0xfe0f) { // ignore variation selector
      codePoints.push(cp.toString(16));
    }
  }
  return codePoints.join('-');
};

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/';

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
  const code = emojiToCodePoint(e);
  const src = `${TWEMOJI_BASE}${code}.svg`;

  return (
    <img
      src={src}
      alt={alt || e}
      width={size}
      height={size}
      draggable={false}
      aria-label={alt || e}
      className={`inline-block align-middle select-none ${className}`}
      style={{ imageRendering: 'crisp-edges' }}
      onError={(ev) => {
        // Fallback : afficher l'emoji natif si l'image CDN échoue
        ev.target.style.display = 'none';
        const span = document.createElement('span');
        span.textContent = e;
        span.style.fontSize = `${size}px`;
        span.style.lineHeight = '1';
        ev.target.parentNode.insertBefore(span, ev.target.nextSibling);
      }}
    />
  );
};

export default Emoji;
