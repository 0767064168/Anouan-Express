const express = require('express');
const router = express.Router();
const disputesController = require('./disputes.controller');
const { validateOpenDispute, validateResolveDispute } = require('./disputes.validation');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { auditMiddleware } = require('../../middlewares/auditLog'); // Assuming it exists

router.post('/', authenticate, authorize('client'), validateOpenDispute, disputesController.openDispute);
router.get('/my', authenticate, authorize('client'), disputesController.getMyDisputes);
router.get('/', authenticate, authorize('admin'), disputesController.getAllDisputes);
router.get('/:id', authenticate, disputesController.getDisputeById);
router.put('/:id/resolve', authenticate, authorize('admin'), auditMiddleware('dispute.resolved'), validateResolveDispute, disputesController.resolveDispute);

module.exports = router;
