// src/utils/qrCode.js
// Génération de QR codes pour les codes de retrait

const QRCode = require('qrcode');

/**
 * Génère un QR code en format Data URL (base64 PNG)
 * @param {string} data - Données à encoder
 * @returns {Promise<string>} - Data URL (data:image/png;base64,...)
 */
const generateQRDataURL = async (data) => {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
    width: 300,
  });
};

/**
 * Génère un QR code en Buffer PNG
 * @param {string} data
 * @returns {Promise<Buffer>}
 */
const generateQRBuffer = async (data) => {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
  });
};

/**
 * Crée les données encodées dans le QR code d'un code de retrait
 * Format : JSON signé avec le code, l'ID de commande et un timestamp
 * @param {string} code - Code alphanumérique
 * @param {string} orderId - UUID de la commande
 */
const buildPickupQRData = (code, orderId) => {
  return JSON.stringify({
    type: 'anouan_pickup',
    code,
    orderId,
    ts: Date.now(),
  });
};

module.exports = { generateQRDataURL, generateQRBuffer, buildPickupQRData };
