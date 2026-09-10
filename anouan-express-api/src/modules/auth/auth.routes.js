// src/modules/auth/auth.routes.js
// Routes d'authentification

const router = require('express').Router();
const ctrl = require('./auth.controller');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const { authLimiter } = require('../../middlewares/rateLimiter');
const v = require('./auth.validation');

router.post('/register',         authLimiter, validate(v.registerSchema),       ctrl.register);
router.post('/login',            authLimiter, validate(v.loginSchema),           ctrl.login);
router.post('/otp/send',         authLimiter, validate(v.sendOtpSchema),         ctrl.sendOtp);
router.post('/otp/verify',       authLimiter, validate(v.verifyOtpSchema),       ctrl.verifyOtp);
router.post('/refresh',                       validate(v.refreshSchema),          ctrl.refresh);
router.post('/logout',           authenticate,                                   ctrl.logout);
router.post('/password/forgot',  authLimiter, validate(v.forgotPasswordSchema),  ctrl.forgotPassword);
router.post('/password/reset',               validate(v.resetPasswordSchema),    ctrl.resetPassword);

module.exports = router;
