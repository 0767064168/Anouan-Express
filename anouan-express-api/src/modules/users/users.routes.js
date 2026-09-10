const express = require('express');
const router = express.Router();
const userController = require('./users.controller');
const { updateMeSchema, updateStatusSchema, fcmTokenSchema } = require('./users.validation');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { auditMiddleware } = require('../../middlewares/auditLog');

router.get('/me', authenticate, userController.getMe);
router.put('/me', authenticate, validate(updateMeSchema), userController.updateMe);
router.put('/me/fcm-token', authenticate, validate(fcmTokenSchema), userController.updateFcmToken);

router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/:id', authenticate, authorize('admin'), userController.getUser);
router.put('/:id/status', authenticate, authorize('admin'), validate(updateStatusSchema), auditMiddleware('user.status_change'), userController.updateStatus);

module.exports = router;
