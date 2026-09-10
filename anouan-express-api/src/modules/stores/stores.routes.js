const express = require('express');
const router = express.Router();
const storesController = require('./stores.controller');
const { validate } = require('../../middlewares/validate');
const { authenticateOptional, authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { createStoreSchema, updateStoreSchema } = require('./stores.validation');

router.get('/', authenticateOptional, storesController.getAll);
router.get('/:id', authenticateOptional, storesController.getById);

router.post('/', authenticate, authorize('admin'), validate(createStoreSchema), storesController.create);
router.put('/:id', authenticate, authorize('admin'), validate(updateStoreSchema), storesController.update);
router.patch('/:id/toggle', authenticate, authorize('admin'), storesController.toggleActive);

module.exports = router;
