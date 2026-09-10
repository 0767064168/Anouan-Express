const vendorService = require('./vendors.service');

const apply = async (req, res, next) => {
  try {
    const vendor = await vendorService.applyAsVendor(req.user.id, req.body);
    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await vendorService.getMyVendorProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const updated = await vendorService.updateMyVendorProfile(req.user.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const getAllVendors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      status: req.query.status,
      search: req.query.search
    };
    
    const result = await vendorService.getAllVendors(page, limit, filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

const validateVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.validateVendor(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

const setCommission = async (req, res, next) => {
  try {
    const vendor = await vendorService.setCommissionRate(req.params.id, req.body.rate);
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const profile = await vendorService.getMyVendorProfile(req.user.id);
    const stats = await vendorService.getVendorStats(profile.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const profile = await vendorService.getPublicVendorProfile(req.params.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  apply,
  getMyProfile,
  updateMyProfile,
  getAllVendors,
  getVendor,
  validateVendor,
  setCommission,
  getStats,
  getPublicProfile
};
