const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const getMyProfile = async (userId) => {
  const result = await query(
    'SELECT id, name, email, phone, role, status, avatar_url, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) throw new AppError('User not found', 404);
  return result.rows[0];
};

const updateMyProfile = async (userId, { name, phone, email, avatarUrl }) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(name);
  }
  if (phone !== undefined) {
    fields.push(`phone = $${index++}`);
    values.push(phone);
  }
  if (email !== undefined) {
    fields.push(`email = $${index++}`);
    values.push(email);
  }
  if (avatarUrl !== undefined) {
    fields.push(`avatar_url = $${index++}`);
    values.push(avatarUrl);
  }

  if (fields.length === 0) {
    return getMyProfile(userId);
  }

  values.push(userId);
  const result = await query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING id, name, email, phone, role, status, avatar_url, created_at, updated_at`,
    values
  );

  return result.rows[0];
};

const getAllUsers = async (page = 1, limit = 20, filters = {}) => {
  const offset = (page - 1) * limit;
  let whereClauses = [];
  let values = [];
  let index = 1;

  if (filters.role) {
    whereClauses.push(`role = $${index++}`);
    values.push(filters.role);
  }
  if (filters.status) {
    whereClauses.push(`status = $${index++}`);
    values.push(filters.status);
  }
  if (filters.search) {
    whereClauses.push(`(name ILIKE $${index} OR email ILIKE $${index} OR phone ILIKE $${index})`);
    values.push(`%${filters.search}%`);
    index++;
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM users ${whereString}`, values);
  const total = parseInt(countResult.rows[0].count, 10);
  const totalPages = Math.ceil(total / limit);

  const dataValues = [...values, limit, offset];
  const dataResult = await query(
    `SELECT id, name, email, phone, role, status, avatar_url, created_at FROM users ${whereString} ORDER BY created_at DESC LIMIT $${index++} OFFSET $${index++}`,
    dataValues
  );

  return {
    data: dataResult.rows,
    pagination: { page, limit, total, totalPages }
  };
};

const getUserById = async (userId) => {
  const result = await query(
    'SELECT id, name, email, phone, role, status, avatar_url, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) throw new AppError('User not found', 404);
  return result.rows[0];
};

const updateUserStatus = async (userId, status) => {
  const result = await query(
    'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, phone, role, status',
    [status, userId]
  );
  if (!result.rows[0]) throw new AppError('User not found', 404);
  return result.rows[0];
};

const updateFcmToken = async (userId, fcmToken) => {
  await query('UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2', [fcmToken, userId]);
  return { success: true };
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateFcmToken
};
