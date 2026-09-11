// src/modules/auth/auth.service.js
// Logique métier de l'authentification

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, withTransaction } = require('../../config/database');
const env = require('../../config/env');
const { AppError } = require('../../middlewares/errorHandler');
const { sendPasswordReset } = require('../../utils/emailService');
const { sendSMS } = require('../../utils/smsService');

// ─── Tokens JWT ───────────────────────────────────────────────

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { sub: userId, role },
    env.jwt.secret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
  const refreshToken = jwt.sign(
    { sub: userId },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
  return { accessToken, refreshToken };
};

// ─── Inscription ──────────────────────────────────────────────

const register = async ({ name, email, phone, password, role = 'client', shopName }) => {
  try {
    const userRole = role === 'vendor' ? 'vendor' : 'client';

    // Vérifier unicité email/téléphone
    if (email) {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length) throw new AppError('Cet email est déjà utilisé.', 409, 'EMAIL_TAKEN');
    }
    if (phone) {
      const existing = await query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (existing.rows.length) throw new AppError('Ce numéro est déjà utilisé.', 409, 'PHONE_TAKEN');
    }

    const passwordHash = await bcrypt.hash(password, env.bcrypt.rounds);

    const result = await query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, status, created_at`,
      [name, email || null, phone || null, passwordHash, userRole]
    );

    const user = result.rows[0];

    if (userRole === 'vendor') {
      const vRes = await query(
        `INSERT INTO vendors (user_id, shop_name) VALUES ($1, $2) RETURNING id`,
        [user.id, shopName || name || 'Ma Boutique']
      );
      user.vendorId = vRes.rows[0]?.id;
      user.shop_name = shopName || name;
    }

    const tokens = generateTokens(user.id, user.role);

    // Stocker le refresh token
    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

    return { user, ...tokens };
  } catch (err) {
    throw err;
  }
};

// ─── Connexion email/mot de passe ─────────────────────────────

const loginWithPassword = async ({ email, password }) => {
  try {
    const result = await query(
      'SELECT id, name, email, phone, password_hash, role, status, avatar_url FROM users WHERE email = $1',
      [email]
    );
    if (!result.rows.length) throw new AppError('Email ou mot de passe incorrect.', 401, 'INVALID_CREDENTIALS');

    const user = result.rows[0];
    if (user.status === 'banned') throw new AppError('Compte suspendu.', 403, 'ACCOUNT_BANNED');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Email ou mot de passe incorrect.', 401, 'INVALID_CREDENTIALS');

    const tokens = generateTokens(user.id, user.role);
    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  } catch (err) {
    throw err;
  }
};

// ─── OTP SMS ──────────────────────────────────────────────────

const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

const sendOTP = async ({ phone }) => {
  const result = await query('SELECT id FROM users WHERE phone = $1', [phone]);
  if (!result.rows.length) throw new AppError('Numéro de téléphone introuvable.', 404, 'PHONE_NOT_FOUND');

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await query(
    'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE phone = $3',
    [otp, expiresAt, phone]
  );

  await sendSMS(phone, `Anouan Express : votre code de connexion est ${otp}. Valable 10 minutes.`);

  return { message: 'Code OTP envoyé par SMS.' };
};

const verifyOTP = async ({ phone, otp }) => {
  const result = await query(
    'SELECT id, name, email, phone, role, status, otp_code, otp_expires_at FROM users WHERE phone = $1',
    [phone]
  );
  if (!result.rows.length) throw new AppError('Numéro introuvable.', 404, 'PHONE_NOT_FOUND');

  const user = result.rows[0];
  if (user.otp_code !== otp) throw new AppError('Code OTP invalide.', 401, 'INVALID_OTP');
  if (new Date() > new Date(user.otp_expires_at)) throw new AppError('Code OTP expiré.', 401, 'OTP_EXPIRED');

  // Invalider l'OTP
  await query('UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1', [user.id]);

  const tokens = generateTokens(user.id, user.role);
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

  const { otp_code, otp_expires_at, ...safeUser } = user;
  return { user: safeUser, ...tokens };
};

// ─── Refresh Token ────────────────────────────────────────────

const refreshAccessToken = async ({ refreshToken }) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw new AppError('Refresh token invalide ou expiré.', 401, 'INVALID_REFRESH_TOKEN');
  }

  const result = await query(
    'SELECT id, role, status, refresh_token FROM users WHERE id = $1',
    [decoded.sub]
  );
  if (!result.rows.length) throw new AppError('Utilisateur introuvable.', 401, 'USER_NOT_FOUND');

  const user = result.rows[0];
  if (user.refresh_token !== refreshToken) {
    throw new AppError('Token de rafraîchissement révoqué.', 401, 'TOKEN_REVOKED');
  }

  const tokens = generateTokens(user.id, user.role);
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

  return tokens;
};

// ─── Déconnexion ──────────────────────────────────────────────

const logout = async (userId) => {
  await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);
};

// ─── Réinitialisation mot de passe ───────────────────────────

const forgotPassword = async ({ email }) => {
  const result = await query('SELECT id, name FROM users WHERE email = $1', [email]);
  // Ne pas révéler si l'email existe ou non
  if (!result.rows.length) return { message: 'Si cet email existe, un lien a été envoyé.' };

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await query(
    'UPDATE users SET reset_token = $1, reset_token_expires_at = $2, otp_code = NULL, otp_expires_at = NULL WHERE id = $3',
    [token, expiresAt, result.rows[0].id]
  );

  const resetUrl = `${env.app.clientUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  await sendPasswordReset(email, { resetUrl });

  return { message: 'Si cet email existe, un lien a été envoyé.' };
};

const resetPassword = async ({ token, email, newPassword }) => {
  const result = await query(
    'SELECT id, reset_token, reset_token_expires_at FROM users WHERE email = $1',
    [email]
  );
  if (!result.rows.length) throw new AppError('Lien invalide.', 400, 'INVALID_RESET_TOKEN');

  const user = result.rows[0];
  if (!user.reset_token || user.reset_token !== token) {
    throw new AppError('Lien invalide.', 400, 'INVALID_RESET_TOKEN');
  }
  if (!user.reset_token_expires_at || new Date() > new Date(user.reset_token_expires_at)) {
    throw new AppError('Lien expiré.', 400, 'RESET_TOKEN_EXPIRED');
  }

  const passwordHash = await bcrypt.hash(newPassword, env.bcrypt.rounds);
  await query(
    'UPDATE users SET password_hash = $1, refresh_token = NULL, reset_token = NULL, reset_token_expires_at = NULL, otp_code = NULL, otp_expires_at = NULL WHERE id = $2',
    [passwordHash, user.id]
  );

  return { message: 'Mot de passe réinitialisé avec succès.' };
};

module.exports = {
  register,
  loginWithPassword,
  sendOTP,
  verifyOTP,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
};
