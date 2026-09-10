const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { logAudit } = require('../../middlewares/auditLog');

const getVendorStats = async (vendorId, { dateFrom, dateTo }) => {
  let dateFilter = '';
  const params = [vendorId];
  if (dateFrom && dateTo) {
    dateFilter = 'AND o.updated_at BETWEEN $2 AND $3';
    params.push(dateFrom, dateTo);
  }

  const statsQuery = `
    SELECT 
      COUNT(DISTINCT o.id) AS total_orders,
      COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE (oi.vendor_id = $1 OR oi.vendor_id IN (SELECT id FROM vendors WHERE user_id = $1)) AND o.status = 'picked_up' ${dateFilter}
  `;
  
  const vendorQuery = `SELECT commission_rate FROM vendors WHERE id = $1 OR user_id = $1`;
  
  const topProductsQuery = `
    SELECT p.title, SUM(oi.unit_price * oi.quantity) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE (oi.vendor_id = $1 OR oi.vendor_id IN (SELECT id FROM vendors WHERE user_id = $1)) AND o.status = 'picked_up'
    GROUP BY p.id, p.title
    ORDER BY revenue DESC
    LIMIT 5
  `;
  
  const monthlyBreakdownQuery = `
    SELECT TO_CHAR(o.updated_at, 'YYYY-MM') AS month, SUM(oi.unit_price * oi.quantity) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE (oi.vendor_id = $1 OR oi.vendor_id IN (SELECT id FROM vendors WHERE user_id = $1)) AND o.status = 'picked_up' AND o.updated_at >= NOW() - INTERVAL '6 months'
    GROUP BY month
    ORDER BY month ASC
  `;

  const [{ rows: stats }, { rows: vendorData }, { rows: topProducts }, { rows: monthlyBreakdown }] = await Promise.all([
    query(statsQuery, params),
    query(vendorQuery, [vendorId]),
    query(topProductsQuery, [vendorId]),
    query(monthlyBreakdownQuery, [vendorId])
  ]);

  const total_orders = parseInt(stats[0].total_orders, 10);
  const total_revenue = parseInt(stats[0].total_revenue, 10);
  const commission_rate = vendorData.length ? parseFloat(vendorData[0].commission_rate) : 0;
  
  const commission_due = Math.floor(total_revenue * (commission_rate / 100));
  const net_revenue = total_revenue - commission_due;
  const avg_order_value = total_orders > 0 ? Math.floor(total_revenue / total_orders) : 0;

  return {
    total_orders,
    total_revenue,
    commission_due,
    net_revenue,
    avg_order_value,
    top_products: topProducts,
    monthly_breakdown: monthlyBreakdown
  };
};

const getVendorPayouts = async (vendorId, page, limit) => {
  const offset = (page - 1) * limit;
  const countRes = await query('SELECT COUNT(*) FROM vendor_payouts WHERE vendor_id = $1', [vendorId]);
  const total = parseInt(countRes.rows[0].count, 10);
  
  const res = await query(`
    SELECT * FROM vendor_payouts 
    WHERE vendor_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `, [vendorId, limit, offset]);

  return {
    data: res.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const getAllPayouts = async (page, limit, filters) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let paramCount = 1;

  if (filters.status) {
    conditions.push(`vp.status = $${paramCount++}`);
    params.push(filters.status);
  }
  if (filters.vendorId) {
    conditions.push(`vp.vendor_id = $${paramCount++}`);
    params.push(filters.vendorId);
  }
  
  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  
  const countQuery = `SELECT COUNT(*) FROM vendor_payouts vp ${whereClause}`;
  const dataQuery = `
    SELECT vp.*, COALESCE(v.shop_name, u.name) as vendor_name 
    FROM vendor_payouts vp
    LEFT JOIN vendors v ON vp.vendor_id = v.id
    LEFT JOIN users u ON v.user_id = u.id
    ${whereClause}
    ORDER BY vp.created_at DESC
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

const createPayout = async (adminId, { vendorId, periodStart, periodEnd, amountDue, notes }) => {
  const res = await query(`
    INSERT INTO vendor_payouts (vendor_id, period_start, period_end, amount_due, status, notes, created_at)
    VALUES ($1, $2, $3, $4, 'pending', $5, NOW())
    RETURNING *
  `, [vendorId, periodStart, periodEnd, amountDue, notes]);
  
  const payout = res.rows[0];
  await logAudit('finance.payout_created', adminId, { payoutId: payout.id, vendorId, amountDue });
  return payout;
};

const markPayoutPaid = async (adminId, payoutId, { paymentRef }) => {
  const check = await query('SELECT status, amount_due FROM vendor_payouts WHERE id = $1', [payoutId]);
  if (!check.rows.length) throw new AppError('Payout not found', 404);
  if (check.rows[0].status === 'paid') throw new AppError('Payout already paid', 400);

  const amountDue = check.rows[0].amount_due;
  const res = await query(`
    UPDATE vendor_payouts 
    SET status = 'paid', amount_paid = $1, paid_at = NOW(), payment_ref = $2
    WHERE id = $3
    RETURNING *
  `, [amountDue, paymentRef, payoutId]);
  
  const payout = res.rows[0];
  await logAudit('finance.payout_paid', adminId, { payoutId: payout.id, paymentRef });
  return payout;
};

const getAdminStats = async (filters) => {
  let dateFilter = '';
  const params = [];
  if (filters.dateFrom && filters.dateTo) {
    dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
    params.push(filters.dateFrom, filters.dateTo);
  }

  const totalsQuery = `
    SELECT 
      COUNT(id) AS total_orders,
      COALESCE(SUM(total_amount), 0) AS total_revenue
    FROM orders ${dateFilter}
  `;

  const clientsQuery = `SELECT COUNT(DISTINCT user_id) FROM orders ${dateFilter}`;
  const vendorsQuery = `SELECT COUNT(*) FROM vendors WHERE status = 'approved'`;

  const topVendorsQuery = `
    SELECT u.name, SUM(oi.unit_price * oi.quantity) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN users u ON oi.vendor_id = u.id
    WHERE o.status = 'picked_up'
    GROUP BY u.id, u.name
    ORDER BY revenue DESC
    LIMIT 5
  `;

  const topProductsQuery = `
    SELECT p.title, SUM(oi.quantity) AS sales
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status = 'picked_up'
    GROUP BY p.id, p.title
    ORDER BY sales DESC
    LIMIT 5
  `;

  const statusQuery = `
    SELECT status, COUNT(*) AS count
    FROM orders
    GROUP BY status
  `;

  const monthlyRevenueQuery = `
    SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, SUM(total_amount) AS revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY month
    ORDER BY month ASC
  `;

  const [totalsRes, clientsRes, vendorsRes, topVendors, topProducts, statusRes, monthlyRes] = await Promise.all([
    query(totalsQuery, params),
    query(clientsQuery, params),
    query(vendorsQuery),
    query(topVendorsQuery),
    query(topProductsQuery),
    query(statusQuery),
    query(monthlyRevenueQuery)
  ]);

  const total_orders = parseInt(totalsRes.rows[0].total_orders, 10);
  const total_revenue = parseInt(totalsRes.rows[0].total_revenue, 10);
  const total_clients = parseInt(clientsRes.rows[0].count, 10);
  const total_vendors = parseInt(vendorsRes.rows[0].count, 10);
  const avg_basket = total_orders > 0 ? Math.floor(total_revenue / total_orders) : 0;

  const orders_by_status = statusRes.rows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.count, 10);
    return acc;
  }, {});

  return {
    total_revenue,
    total_orders,
    total_clients,
    total_vendors,
    avg_basket,
    top_vendors: topVendors.rows,
    top_products: topProducts.rows,
    orders_by_status,
    revenue_by_month: monthlyRes.rows
  };
};

const exportOrdersCSV = async (filters) => {
  let whereStr = '';
  const params = [];
  let paramCount = 1;

  if (filters.dateFrom && filters.dateTo) {
    whereStr += `WHERE o.created_at BETWEEN $${paramCount++} AND $${paramCount++}`;
    params.push(filters.dateFrom, filters.dateTo);
  }

  const queryStr = `
    SELECT 
      o.id as order_id, o.created_at, o.status, o.total_amount,
      c.name as client_name, c.email as client_email,
      u.name as vendor_name, p.title as product_title,
      oi.quantity, oi.unit_price
    FROM orders o
    JOIN users c ON o.user_id = c.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    JOIN users u ON oi.vendor_id = u.id
    ${whereStr}
    ORDER BY o.created_at DESC
  `;
  
  const res = await query(queryStr, params);
  
  if (!res.rows.length) {
    return 'order_id,created_at,status,total_amount,client_name,client_email,vendor_name,product_title,quantity,unit_price\n';
  }

  const headers = Object.keys(res.rows[0]).join(',');
  const rows = res.rows.map(row => {
    return Object.values(row).map(val => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (str.includes(',') || str.includes('"')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
};

module.exports = {
  getVendorStats,
  getVendorPayouts,
  getAllPayouts,
  createPayout,
  markPayoutPaid,
  getAdminStats,
  exportOrdersCSV
};
