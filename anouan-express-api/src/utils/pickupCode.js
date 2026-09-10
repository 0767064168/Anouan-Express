// src/utils/pickupCode.js
// Génération et validation des codes de retrait sécurisés

const crypto = require('crypto');
const env = require('../config/env');

// Caractères sans ambiguïté : 0/O et 1/I exclus
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Génère un code alphanumérique unique de longueur configurable.
 * Format : ex. "7K4D9XQP" (8 caractères)
 */
const generatePickupCode = (length = env.pickup.codeLength) => {
  const chars = [];
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    chars.push(CHARSET[randomBytes[i] % CHARSET.length]);
  }
  return chars.join('');
};

/**
 * Calcule la date d'expiration du code
 * @param {number} [days] - Nombre de jours de validité
 * @returns {Date}
 */
const getCodeExpiry = (days = env.pickup.validityDays) => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};

/**
 * Formate un code en groupes de 4 pour l'affichage
 * Ex: "7K4D9XQP" → "7K4D-9XQP"
 */
const formatCode = (code) => {
  const half = Math.ceil(code.length / 2);
  return `${code.slice(0, half)}-${code.slice(half)}`;
};

/**
 * Vérifie qu'un code est dans le bon format (sans le tiret)
 */
const isValidCodeFormat = (code) => {
  const clean = code.replace(/-/g, '').toUpperCase();
  return clean.length === env.pickup.codeLength && /^[A-HJ-NP-Z2-9]+$/.test(clean);
};

/**
 * Nettoie le code saisi par l'utilisateur (retire tirets, met en majuscules)
 */
const normalizeCode = (code) => code.replace(/-/g, '').toUpperCase().trim();

module.exports = {
  generatePickupCode,
  getCodeExpiry,
  formatCode,
  isValidCodeFormat,
  normalizeCode,
};
