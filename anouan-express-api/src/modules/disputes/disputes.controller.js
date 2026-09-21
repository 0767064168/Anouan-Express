const disputesService = require('./disputes.service');

class DisputesController {
  async openDispute(req, res, next) {
    try {
      const disputeData = { ...req.body };
      if (req.files && req.files.length) {
        disputeData.images = req.files.map((f) => `/uploads/disputes/${f.filename}`);
      } else if (typeof disputeData.images === 'string') {
        try {
          disputeData.images = JSON.parse(disputeData.images);
        } catch {
          disputeData.images = [disputeData.images];
        }
      }
      const dispute = await disputesService.openDispute(req.user.id, disputeData);
      res.status(201).json({ success: true, data: dispute });
    } catch (err) {
      next(err);
    }
  }

  async getMyDisputes(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await disputesService.getMyDisputes(req.user.id, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getAllDisputes(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = { status: req.query.status };
      const result = await disputesService.getAllDisputes(page, limit, filters);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getDisputeById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await disputesService.getDisputeById(id, req.user);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async resolveDispute(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const dispute = await disputesService.resolveDispute(id, adminId, req.body);
      res.status(200).json({ success: true, data: dispute });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DisputesController();
