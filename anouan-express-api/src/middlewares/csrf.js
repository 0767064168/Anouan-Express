const crypto = require('crypto');
const { AppError } = require('./errorHandler');

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method) || !req.cookies?.accessToken) return next();

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) {
    return next(new AppError('Jeton CSRF requis.', 403, 'CSRF_TOKEN_MISSING'));
  }

  const expected = Buffer.from(cookieToken);
  const received = Buffer.from(headerToken);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return next(new AppError('Jeton CSRF invalide.', 403, 'CSRF_TOKEN_INVALID'));
  }

  return next();
};

module.exports = { CSRF_COOKIE, createCsrfToken, csrfProtection };
