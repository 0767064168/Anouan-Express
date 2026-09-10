const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const emailService = require('../../utils/emailService');

const applyAsVendor = async (userId, { shopName, description, legalDocUrl }) => {
  const checkResult = await query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
  if (checkResult.rows.length > 0) throw new AppError('User has already applied or is a vendor', 400);

  const result = await query(
    `INSERT INTO vendors (user_id, shop_name, description, legal_doc_url, validation_status, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW()) RETURNING *`,
    [userId, shopName, description, legalDocUrl]
  );
  return result.rows[0];
};

const getMyVendorProfile = async (userId) => {
  const result = await query(
    `SELECT v.*, u.name, u.email, u.phone 
     FROM vendors v 
     JOIN users u ON v.user_id = u.id 
     WHERE v.user_id = $1`,
    [userId]
  );
  if (!result.rows[0]) throw new AppError('Vendor profile not found', 404);
  return result.rows[0];
};

const updateMyVendorProfile = async (userId, { shopName, description, logoUrl }) => {
  const checkResult = await query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
  if (!checkResult.rows[0]) throw new AppError('Vendor profile not found', 404);

  const vendorId = checkResult.rows[0].id;
  const fields = [];
  const values = [];
  let index = 1;

  if (shopName !== undefined) {
    fields.push(`shop_name = $${index++}`);
    values.push(shopName);
  }
  if (description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(description);
  }
  if (logoUrl !== undefined) {
    fields.push(`logo_url = $${index++}`);
    values.push(logoUrl);
  }

  if (fields.length === 0) return getMyVendorProfile(userId);

  values.push(vendorId);
  const result = await query(
    `UPDATE vendors SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`,
    values
  );

  return result.rows[0];
};

const getAllVendors = async (page = 1, limit = 20, filters = {}) => {
  const offset = (page - 1) * limit;
  let whereClauses = [];
  let values = [];
  let index = 1;

  if (filters.status) {
    whereClauses.push(`v.validation_status = $${index++}`);
    values.push(filters.status);
  }
  if (filters.search) {
    whereClauses.push(`(v.shop_name ILIKE $${index} OR u.name ILIKE $${index} OR u.email ILIKE $${index})`);
    values.push(`%${filters.search}%`);
    index++;
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM vendors v JOIN users u ON v.user_id = u.id ${whereString}`;
  const countResult = await query(countQuery, values);
  const total = parseInt(countResult.rows[0].count, 10);
  const totalPages = Math.ceil(total / limit);

  const dataValues = [...values, limit, offset];
  const dataQuery = `
    SELECT v.id, v.user_id, v.shop_name, v.validation_status, v.commission_rate, v.created_at, u.name as owner_name, u.email as owner_email 
    FROM vendors v 
    JOIN users u ON v.user_id = u.id 
    ${whereString} 
    ORDER BY v.created_at DESC 
    LIMIT $${index++} OFFSET $${index++}
  `;
  const dataResult = await query(dataQuery, dataValues);

  return {
    data: dataResult.rows,
    pagination: { page, limit, total, totalPages }
  };
};

const getVendorById = async (vendorId) => {
  const result = await query(
    `SELECT v.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone 
     FROM vendors v 
     JOIN users u ON v.user_id = u.id 
     WHERE v.id = $1`,
    [vendorId]
  );
  if (!result.rows[0]) throw new AppError('Vendor not found', 404);
  return result.rows[0];
};

const validateVendor = async (vendorId, adminId, { action, reason }) => {
  return await withTransaction(async (client) => {
    const vendorResult = await client.query('SELECT v.*, u.email, u.name FROM vendors v JOIN users u ON v.user_id = u.id WHERE v.id = $1', [vendorId]);
    if (!vendorResult.rows[0]) throw new AppError('Vendor not found', 404);
    
    const vendor = vendorResult.rows[0];
    let newStatus;
    
    switch (action) {
      case 'approve': newStatus = 'approved'; break;
      case 'reject': newStatus = 'rejected'; break;
      case 'suspend': newStatus = 'suspended'; break;
      case 'reactivate': newStatus = 'approved'; break;
      default: throw new AppError('Invalid action', 400);
    }

    const result = await client.query(
      'UPDATE vendors SET validation_status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [newStatus, reason || null, vendorId]
    );
    
    if (newStatus === 'approved') {
      await client.query('UPDATE users SET role = $1 WHERE id = $2', ['vendor', vendor.user_id]);
      if (emailService && emailService.sendVendorApproved) {
        await emailService.sendVendorApproved(vendor.email, vendor.name, vendor.shop_name);
      }
    }

    return result.rows[0];
  });
};

const setCommissionRate = async (vendorId, rate) => {
  const result = await query(
    'UPDATE vendors SET commission_rate = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [rate, vendorId]
  );
  if (!result.rows[0]) throw new AppError('Vendor not found', 404);
  return result.rows[0];
};

const getVendorStats = async (vendorId) => {
  const orderResult = await query(
    `SELECT COUNT(id) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue, COALESCE(SUM(platform_fee), 0) as commission_due 
     FROM orders 
     WHERE vendor_id = $1 AND status = 'delivered'`,
    [vendorId]
  );
  
  const ratingResult = await query(
    `SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE vendor_id = $1`,
    [vendorId]
  );

  return {
    total_orders: parseInt(orderResult.rows[0].total_orders, 10),
    total_revenue: parseInt(orderResult.rows[0].total_revenue, 10),
    commission_due: parseInt(orderResult.rows[0].commission_due, 10),
    avg_rating: parseFloat(ratingResult.rows[0].avg_rating)
  };
};

const getPublicVendorProfile = async (vendorId) => {
  const result = await query(
    `SELECT id, shop_name, description, logo_url 
     FROM vendors 
     WHERE id = $1 AND validation_status = 'approved'`,
    [vendorId]
  );
  if (!result.rows[0]) throw new AppError('Vendor not found or not approved', 404);
  
  const vendor = result.rows[0];
  
  const stats = await getVendorStats(vendorId);
  return {
    ...vendor,
    avg_rating: stats.avg_rating,
    total_sales: stats.total_orders
  };
};

module.exports = {
  applyAsVendor,
  getMyVendorProfile,
  updateMyVendorProfile,
  getAllVendors,
  getVendorById,
  validateVendor,
  setCommissionRate,
  getVendorStats,
  getPublicVendorProfile
};
