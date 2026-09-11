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
  const vendorRes = await query('SELECT id FROM vendors WHERE user_id = $1 OR id = $1 LIMIT 1', [vendorId]);
  if (!vendorRes.rows.length) throw new AppError('Vendeur introuvable.', 404, 'VENDOR_NOT_FOUND');
  const resolvedVendorId = vendorRes.rows[0].id;
  const countRes = await query('SELECT COUNT(*) FROM vendor_payouts WHERE vendor_id = $1', [resolvedVendorId]);
  const total = parseInt(countRes.rows[0].count, 10);
  
  const res = await query(`
    SELECT * FROM vendor_payouts 
    WHERE vendor_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `, [resolvedVendorId, limit, offset]);

  return {
    data: res.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const requestVendorPayout = async (userId, { amount, method, phone }) => {
  const vendorRes = await query(
    "SELECT id FROM vendors WHERE user_id = $1 AND validation_status = 'approved'",
    [userId]
  );
  if (!vendorRes.rows.length) throw new AppError('Vendeur introuvable ou non approuvé.', 403, 'VENDOR_NOT_APPROVED');

  const vendorId = vendorRes.rows[0].id;
  const pendingRes = await query(
    "SELECT id FROM vendor_payouts WHERE vendor_id = $1 AND status IN ('pending', 'processing') LIMIT 1",
    [vendorId]
  );
  if (pendingRes.rows.length) throw new AppError('Une demande de versement est déjà en cours.', 409, 'PAYOUT_ALREADY_PENDING');

  const balanceRes = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN o.status = 'picked_up' THEN oi.unit_price * oi.quantity ELSE 0 END), 0) AS gross_revenue,
      COALESCE((SELECT SUM(amount_paid) FROM vendor_payouts WHERE vendor_id = $1 AND status = 'paid'), 0) AS paid_amount,
      COALESCE((SELECT SUM(amount_due) FROM vendor_payouts WHERE vendor_id = $1 AND status IN ('pending', 'processing')), 0) AS pending_amount,
      COALESCE(v.commission_rate, 0) AS commission_rate
    FROM vendors v
    LEFT JOIN order_items oi ON oi.vendor_id = v.id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'picked_up'
    WHERE v.id = $1
    GROUP BY v.id, v.commission_rate
  `, [vendorId]);
  const balance = balanceRes.rows[0];
  const grossRevenue = Number(balance?.gross_revenue || 0);
  const commission = grossRevenue * (Number(balance?.commission_rate || 0) / 100);
  const availableBalance = Math.max(0, grossRevenue - commission - Number(balance?.paid_amount || 0) - Number(balance?.pending_amount || 0));
  if (Number(amount) > availableBalance) {
    throw new AppError('Le montant dépasse le solde disponible.', 422, 'INSUFFICIENT_PAYOUT_BALANCE');
  }

  const start = new Date();
  start.setUTCDate(1);
  const end = new Date();
  const payoutRes = await query(
    `INSERT INTO vendor_payouts
      (vendor_id, period_start, period_end, amount_due, status, payout_method, payout_phone, notes, created_at)
     VALUES ($1, $2::date, $3::date, $4, 'pending', $5, $6, $7, NOW())
     RETURNING *`,
    [vendorId, start.toISOString(), end.toISOString(), amount, method, phone, 'Demande initiée par le vendeur']
  );

  await logAudit('finance.vendor_payout_requested', userId, {
    payoutId: payoutRes.rows[0].id,
    vendorId,
    amount,
    method,
  });

  return payoutRes.rows[0];
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

const rejectPayout = async (adminId, payoutId, { reason = '' }) => {
  const check = await query('SELECT status FROM vendor_payouts WHERE id = $1', [payoutId]);
  if (!check.rows.length) throw new AppError('Payout not found', 404);
  if (check.rows[0].status !== 'pending') {
    throw new AppError('Only pending payouts can be rejected', 400);
  }

  const res = await query(
    `UPDATE vendor_payouts
     SET status = 'failed', notes = $1
     WHERE id = $2
     RETURNING *`,
    [reason || 'Reversement rejeté par un administrateur', payoutId]
  );

  const payout = res.rows[0];
  await logAudit({
    action: 'finance.payout_rejected',
    entityType: 'vendor_payout',
    entityId: payoutId,
    metadata: { reason },
    userId: adminId,
  });
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

  const clientsQuery = `SELECT COUNT(DISTINCT client_id) FROM orders ${dateFilter}`;
  const vendorsQuery = `SELECT COUNT(*) FROM vendors WHERE validation_status = 'approved'`;

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

  const payoutSummaryQuery = `
    SELECT
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_due ELSE 0 END), 0) AS pending_payouts,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_paid ELSE 0 END), 0) AS paid_payouts
    FROM vendor_payouts
  `;

  const [totalsRes, clientsRes, vendorsRes, topVendors, topProducts, statusRes, monthlyRes, payoutSummaryRes] = await Promise.all([
    query(totalsQuery, params),
    query(clientsQuery, params),
    query(vendorsQuery),
    query(topVendorsQuery),
    query(topProductsQuery),
    query(statusQuery),
    query(monthlyRevenueQuery),
    query(payoutSummaryQuery)
  ]);

  const totalOrders = parseInt(totalsRes.rows[0].total_orders, 10);
  const totalRevenue = parseInt(totalsRes.rows[0].total_revenue, 10);
  const totalClients = parseInt(clientsRes.rows[0].count, 10);
  const totalVendors = parseInt(vendorsRes.rows[0].count, 10);
  const avgBasket = totalOrders > 0 ? Math.floor(totalRevenue / totalOrders) : 0;
  const totalCommission = Math.floor(totalRevenue * 0.1);
  const pendingPayouts = Number(payoutSummaryRes.rows[0]?.pending_payouts || 0);
  const paidPayouts = Number(payoutSummaryRes.rows[0]?.paid_payouts || 0);

  const ordersByStatus = statusRes.rows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.count, 10);
    return acc;
  }, {});

  return {
    totalRevenue,
    totalOrders,
    totalClients,
    totalVendors,
    avgBasket,
    totalCommission,
    pendingPayouts,
    paidPayouts,
    topVendors: topVendors.rows,
    topProducts: topProducts.rows,
    ordersByStatus,
    revenueByMonth: monthlyRes.rows
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
      v.shop_name as vendor_name, COALESCE(oi.title, p.title) as product_title,
      oi.quantity, oi.unit_price
    FROM orders o
    JOIN users c ON o.client_id = c.id
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    JOIN vendors v ON oi.vendor_id = v.id
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
  requestVendorPayout,
  getAllPayouts,
  createPayout,
  markPayoutPaid,
  rejectPayout,
  getAdminStats,
  exportOrdersCSV
};
