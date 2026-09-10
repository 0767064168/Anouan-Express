// src/modules/auth/auth.controller.js
// Contrôleur HTTP pour les routes d'authentification

const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.loginWithPassword(req.body);
    res.json({ success: true, data });
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
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const data = await authService.refreshAccessToken(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
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
