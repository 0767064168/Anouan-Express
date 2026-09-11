const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');
const { createSchema, updateSchema } = require('./categories.validation');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');

// Public routes
router.get('/', categoriesController.getAll);
router.get('/:id', categoriesController.getById);

// Admin routes
router.post('/', authenticate, authorize('admin'), validate({ body: createSchema }), categoriesController.create);
router.put('/:id', authenticate, authorize('admin'), validate({ body: updateSchema }), categoriesController.update);
router.delete('/:id', authenticate, authorize('admin'), categoriesController.remove);

module.exports = router;
