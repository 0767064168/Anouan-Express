const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const getMyProfile = async (userId) => {
  const result = await query(
    `SELECT users.id, users.name, users.email, users.phone, users.role, users.status, users.avatar_url,
        users.store_id, stores.name AS store_name, stores.city AS store_city, users.created_at, users.updated_at
     FROM users LEFT JOIN stores ON stores.id = users.store_id WHERE users.id = $1`,
    [userId]
  );
  if (!result.rows[0]) throw new AppError('User not found', 404);
  return result.rows[0];
};

const updateMyProfile = async (userId, { name, phone, email, avatarUrl }) => {
  const fields = [];
  const values = [];
  let index = 1;

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = await query(
      'SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2 LIMIT 1',
      [normalizedEmail, userId]
    );
    if (duplicate.rows.length) {
      throw new AppError('Cette adresse email est déjà utilisée.', 409, 'EMAIL_ALREADY_EXISTS');
    }
    email = normalizedEmail;
  }

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
    `SELECT users.id, users.name, users.email, users.phone, users.role, users.status, users.avatar_url,
        users.store_id, stores.name AS store_name, stores.city AS store_city, users.created_at
     FROM users LEFT JOIN stores ON stores.id = users.store_id
     ${whereString.replace(/\brole\b/g, 'users.role').replace(/\bstatus\b/g, 'users.status').replace(/\bname\b/g, 'users.name').replace(/\bemail\b/g, 'users.email').replace(/\bphone\b/g, 'users.phone')}
     ORDER BY users.created_at DESC LIMIT $${index++} OFFSET $${index++}`,
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

const updateUserStatus = async (userId, status, actorId) => {
  if (String(userId) === String(actorId)) {
    throw new AppError('Vous ne pouvez pas modifier le statut de votre propre compte.', 400, 'SELF_STATUS_CHANGE');
  }
  const result = await query(
    'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, phone, role, status',
    [status, userId]
  );
  if (!result.rows[0]) throw new AppError('User not found', 404);
  return result.rows[0];
};

const deleteUser = async (userId, actorId) => {
  if (String(userId) === String(actorId)) {
    throw new AppError('Vous ne pouvez pas supprimer votre propre compte.', 400, 'SELF_DELETE');
  }

  try {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email, role',
      [userId]
    );
    if (!result.rows[0]) throw new AppError('User not found', 404);
    return result.rows[0];
  } catch (err) {
    if (err.code === '23503') {
      throw new AppError('Ce compte possède des données liées et ne peut pas être supprimé. Suspendez-le plutôt.', 409, 'USER_HAS_DEPENDENCIES');
    }
    throw err;
  }
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
  deleteUser,
  updateFcmToken
};
