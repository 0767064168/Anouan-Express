// src/middlewares/sanitize.js
// Protection XSS — supprime les balises HTML dangereuses des champs string

const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
};

const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return escapeHtml(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  const result = {};
  for (const key of Object.keys(obj)) {
    const skipFields = ['password', 'token', 'image_url', 'avatar_url', 'image_base64', 'banner_url'];
    result[key] = skipFields.includes(key) ? obj[key] : sanitizeObject(obj[key]);
  }
  return result;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body)  req.body  = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  next();
};

module.exports = { sanitizeInputs, sanitizeObject, escapeHtml };
