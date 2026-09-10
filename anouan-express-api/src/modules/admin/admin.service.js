const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { logAudit } = require('../../middlewares/auditLog');

const getBanners = async (activeOnly = false) => {
  let queryStr = 'SELECT * FROM banners';
  if (activeOnly) {
    queryStr += ' WHERE is_active = true';
  }
  queryStr += ' ORDER BY position ASC, created_at DESC';
  const res = await query(queryStr);
  return res.rows;
};

const createBanner = async ({ title, imageUrl, linkUrl, position, startsAt, endsAt }) => {
  const res = await query(`
    INSERT INTO banners (title, image_url, link_url, position, starts_at, ends_at, is_active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
    RETURNING *
  `, [title, imageUrl, linkUrl, position || 0, startsAt, endsAt]);
  return res.rows[0];
};

const updateBanner = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${snakeKey} = $${paramCount++}`);
      values.push(val);
    }
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const res = await query(`
    UPDATE banners
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);

  if (!res.rows.length) throw new AppError('Banner not found', 404);
  return res.rows[0];
};

const deleteBanner = async (id) => {
  const res = await query('DELETE FROM banners WHERE id = $1 RETURNING id', [id]);
  if (!res.rows.length) throw new AppError('Banner not found', 404);
  return true;
};

const toggleBannerActive = async (id) => {
  const res = await query(`
    UPDATE banners
    SET is_active = NOT is_active, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id]);
  if (!res.rows.length) throw new AppError('Banner not found', 404);
  return res.rows[0];
};

const getFlashSales = async (page, limit, activeOnly = false) => {
  const offset = (page - 1) * limit;
  let whereStr = '';
  if (activeOnly) {
    whereStr = 'WHERE fs.starts_at <= NOW() AND fs.ends_at >= NOW()';
  }

  const countRes = await query(`SELECT COUNT(*) FROM flash_sales fs ${whereStr}`);
  const total = parseInt(countRes.rows[0].count, 10);

  const res = await query(`
    SELECT fs.*, p.title as product_title
    FROM flash_sales fs
    JOIN products p ON fs.product_id = p.id
    ${whereStr}
    ORDER BY fs.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  return {
    data: res.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const createFlashSale = async ({ productId, discountPercent, flashPrice, startsAt, endsAt }) => {
  const check = await query('SELECT id FROM products WHERE id = $1', [productId]);
  if (!check.rows.length) throw new AppError('Product not found', 404);

  const res = await query(`
    INSERT INTO flash_sales (product_id, discount_percent, flash_price, starts_at, ends_at, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `, [productId, discountPercent, flashPrice, startsAt, endsAt]);
  
  return res.rows[0];
};

const deleteFlashSale = async (id) => {
  const res = await query('DELETE FROM flash_sales WHERE id = $1 RETURNING id', [id]);
  if (!res.rows.length) throw new AppError('Flash sale not found', 404);
  return true;
};

const getPlatformSettings = async () => {
  const res = await query('SELECT key, value FROM platform_settings');
  const settings = {};
  res.rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
};

const updateSetting = async (key, value, adminId) => {
  const res = await query(`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
    RETURNING *
  `, [key, JSON.stringify(value)]);
  
  await logAudit('admin.setting_updated', adminId, { key, value });
  return res.rows[0];
};

const getUserRoles = async () => {
  const res = await query(`
    SELECT id, name, email, role, status 
    FROM users 
    WHERE role IN ('admin', 'agent')
    ORDER BY created_at DESC
  `);
  return res.rows;
};

const assignRole = async (adminId, userId, role) => {
  if (!['admin', 'agent'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const res = await query(`
    UPDATE users SET role = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, name, email, role, status
  `, [role, userId]);

  if (!res.rows.length) throw new AppError('User not found', 404);

  await logAudit('admin.role_assigned', adminId, { userId, role });
  return res.rows[0];
};

const getAuditLogs = async (page, limit, filters) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let paramCount = 1;

  if (filters.action) {
    conditions.push(`al.action = $${paramCount++}`);
    params.push(filters.action);
  }
  if (filters.userId) {
    conditions.push(`al.user_id = $${paramCount++}`);
    params.push(filters.userId);
  }
  if (filters.dateFrom && filters.dateTo) {
    conditions.push(`al.created_at BETWEEN $${paramCount++} AND $${paramCount++}`);
    params.push(filters.dateFrom, filters.dateTo);
  }

  const whereStr = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countQuery = `SELECT COUNT(*) FROM audit_logs al ${whereStr}`;
  const dataQuery = `
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereStr}
    ORDER BY al.created_at DESC
    LIMIT $${paramCount++} OFFSET $${paramCount++}
  `;

  const [countRes, dataRes] = await Promise.all([
    query(countQuery, params.slice(0, paramCount - 3)),
    query(dataQuery, [...params, limit, offset])
  ]);

  const total = parseInt(countRes.rows[0].count, 10);
  return {
    data: dataRes.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  getFlashSales,
  createFlashSale,
  deleteFlashSale,
  getPlatformSettings,
  updateSetting,
  getUserRoles,
  assignRole,
  getAuditLogs
};
