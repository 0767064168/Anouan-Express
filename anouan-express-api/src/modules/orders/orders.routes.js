const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { validate } = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const { authorize } = require('../../middlewares/authorize');
const { createOrderSchema, updateItemStatusSchema } = require('./orders.validation');

router.post('/', authenticate, authorize('client', 'admin', 'vendor'), validate(createOrderSchema), ordersController.createOrder);
router.get('/my', authenticate, authorize('client', 'admin'), ordersController.getMyOrders);
router.get('/vendor', authenticate, authorize('vendor', 'admin'), ordersController.getVendorOrders);
router.get('/', authenticate, authorize('admin', 'agent'), ordersController.getAllOrders);
router.get('/:id', authenticate, ordersController.getOrderById);
router.patch('/:id/status', authenticate, authorize('admin', 'agent', 'vendor'), ordersController.updateOrderStatus);
router.put('/:id/items/:itemId/status', authenticate, authorize('vendor', 'admin'), validate(updateItemStatusSchema), ordersController.updateItemStatus);
router.post('/:id/cancel', authenticate, authorize('client', 'admin'), ordersController.cancelOrder);
router.get('/:id/invoice', authenticate, authorize('client', 'admin'), ordersController.getInvoicePDF);
router.get('/:id/delivery-slip', authenticate, authorize('vendor', 'admin'), ordersController.getDeliverySlipPDF);

module.exports = router;

