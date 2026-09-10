// src/modules/auth/auth.controller.js
// Contrôleur HTTP pour les routes d'authentification

const authService = require('./auth.service');

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
  path: '/',
});

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
};

const withoutTokens = ({ accessToken, refreshToken, ...data }) => data;

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    setAuthCookies(res, data);
    res.status(201).json({ success: true, data: withoutTokens(data) });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.loginWithPassword(req.body);
    setAuthCookies(res, data);
    res.json({ success: true, data: withoutTokens(data) });
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
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
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
