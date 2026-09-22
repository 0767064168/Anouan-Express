const ordersService = require('./orders.service');

exports.createOrder = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.user.id, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await ordersService.getMyOrders(req.user.id, parseInt(page || 1, 10), parseInt(limit || 20, 10), status);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getVendorOrders = async (req, res, next) => {
  try {
    const { page, limit, status, vendorId: queryVendorId } = req.query;
    let vendorId = req.user.vendor_id;
    if (!vendorId && (req.user.role === 'admin' || req.user.role === 'agent')) {
      vendorId = queryVendorId || null;
    }
    const result = await ordersService.getVendorOrders(vendorId, parseInt(page || 1, 10), parseInt(limit || 20, 10), status);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    if (req.user.role === 'agent') {
      filters.storeId = req.user.store_id;
      if (!filters.storeId) {
        return res.status(403).json({ success: false, message: 'Votre compte Agent n’est pas affecté à un point relais.', code: 'AGENT_STORE_REQUIRED' });
      }
    }
    const result = await ordersService.getAllOrders(parseInt(page || 1, 10), parseInt(limit || 20, 10), filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(req.params.id, req.user);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const result = await ordersService.updateOrderStatus(req.params.id, req.body.status, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.updateItemStatus = async (req, res, next) => {
  try {
    const vendorId = req.user.vendor_id || req.body.vendorId;
    const result = await ordersService.updateItemStatus(req.params.id, req.params.itemId, vendorId, req.body.status, req.user.role === 'admin');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const result = await ordersService.cancelOrder(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getInvoicePDF = async (req, res, next) => {
  try {
    const pdfBuffer = await ordersService.getInvoicePDF(req.params.id, req.user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${req.params.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

exports.getDeliverySlipPDF = async (req, res, next) => {
  try {
    const pdfBuffer = await ordersService.getDeliverySlipPDF(req.params.id, req.user.vendor_id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=delivery_slip_${req.params.id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

exports.getMyStats = async (req, res, next) => {
  try {
    const stats = await ordersService.getMyStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

exports.setDelegate = async (req, res, next) => {
  try {
    const updated = await ordersService.setDelegate(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

exports.getAgentStats = async (req, res, next) => {
  try {
    const storeId = req.user.store_id;
    if (!storeId) {
      return res.status(403).json({ success: false, message: 'Votre compte Agent n\u2019est pas affecté à un point relais.', code: 'AGENT_STORE_REQUIRED' });
    }
    const stats = await ordersService.getAgentStats(storeId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};
