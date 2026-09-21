const userService = require('./users.service');

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMyProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const updatedUser = await userService.updateMyProfile(req.user.id, req.body);
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      role: req.query.role,
      status: req.query.status,
      search: req.query.search
    };
    
    const result = await userService.getAllUsers(page, limit, filters);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.status, req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.id, req.user.id);
    res.json({ success: true, data: user, message: 'Compte supprimé avec succès.' });
  } catch (err) {
    next(err);
  }
};

const updateFcmToken = async (req, res, next) => {
  try {
    await userService.updateFcmToken(req.user.id, req.body.fcmToken);
    res.json({ success: true, data: { message: 'FCM token updated successfully' } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  updateMe,
  getAllUsers,
  getUser,
  updateStatus,
  deleteUser,
  updateFcmToken
};
