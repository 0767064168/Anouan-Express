// src/modules/auth/auth.controller.js
// Contrôleur HTTP pour les routes d'authentification

const authService = require('./auth.service');
const { CSRF_COOKIE, createCsrfToken } = require('../../middlewares/csrf');

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
  path: '/',
});

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieOptions(0));
  res.clearCookie('refreshToken', cookieOptions(0));
  res.clearCookie(CSRF_COOKIE, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
  res.cookie(CSRF_COOKIE, createCsrfToken(), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const withoutTokens = ({ accessToken, refreshToken, ...data }) => data;

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    setAuthCookies(res, data);
    res.status(201).json({
      success: true,
      data: {
        ...withoutTokens(data),
        accessToken: data.accessToken,
      },
    });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.loginWithPassword(req.body);
    setAuthCookies(res, data);
    res.json({
      success: true,
      data: {
        ...withoutTokens(data),
        accessToken: data.accessToken,
      },
    });
  } catch (err) { next(err); }
};

const sendOtp = async (req, res, next) => {
  try {
    const data = await authService.sendOTP(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const verifyOtp = async (req, res, next) => {
  try {
    const data = await authService.verifyOTP(req.body);
    setAuthCookies(res, data);
    res.json({ success: true, data: withoutTokens(data) });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const data = await authService.refreshAccessToken({
      refreshToken: req.cookies?.refreshToken || req.body.refreshToken,
    });
    setAuthCookies(res, data);
    res.json({ success: true, data: withoutTokens(data) });
  } catch (err) {
    if (err.statusCode === 401) clearAuthCookies(res);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    clearAuthCookies(res);
    res.json({ success: true, message: 'Déconnecté avec succès.' });
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const data = await authService.resetPassword(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { register, login, sendOtp, verifyOtp, refresh, logout, forgotPassword, resetPassword };
