const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { logAudit } = require('../../middlewares/auditLog');
const env = require('../../config/env');

const getBanners = async (activeOnly = false) => {
  let queryStr = 'SELECT * FROM banners';
  if (activeOnly) {
    queryStr += ' WHERE is_active = true AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())';
  }
  queryStr += ' ORDER BY position ASC, created_at DESC';
  const res = await query(queryStr);
  return res.rows;
};

const createBanner = async ({ title, imageUrl, linkUrl, position, startsAt, endsAt, subtitle, badge, themeColor, productName, productPrice, productOldPrice, category }) => {
  const res = await query(`
    INSERT INTO banners (title, image_url, link_url, position, starts_at, ends_at, subtitle, badge, theme_color, product_name, product_price, product_old_price, category, is_active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW(), NOW())
    RETURNING *
  `, [title, imageUrl, linkUrl, position || 0, startsAt, endsAt, subtitle, badge, themeColor, productName, productPrice || null, productOldPrice || null, category]);
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
    whereStr = 'WHERE fs.is_active = true AND fs.starts_at <= NOW() AND fs.ends_at >= NOW()';
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

const createFlashSale = async ({ productId, discountPercent, flashPrice, stock, imageUrl, startsAt, endsAt }) => {
  const check = await query('SELECT id FROM products WHERE id = $1', [productId]);
  if (!check.rows.length) throw new AppError('Product not found', 404);

  const res = await query(`
    INSERT INTO flash_sales (product_id, discount_percent, flash_price, stock, image_url, starts_at, ends_at, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `, [productId, discountPercent, flashPrice, stock, imageUrl || null, startsAt, endsAt]);
  
  return res.rows[0];
};

const createFlashSales = async ({ startsAt, endsAt, products }) => withTransaction(async (client) => {
  const productIds = products.map((product) => product.productId);
  const check = await client.query('SELECT id FROM products WHERE id = ANY($1::uuid[])', [productIds]);
  const validIds = new Set(check.rows.map((row) => row.id));
  const missing = productIds.find((id) => !validIds.has(id));
  if (missing) throw new AppError(`Product not found: ${missing}`, 404);

  const created = [];
  for (const product of products) {
    const result = await client.query(`
      INSERT INTO flash_sales (product_id, discount_percent, flash_price, stock, image_url, starts_at, ends_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [product.productId, product.discountPercent, product.flashPrice, product.stock, product.imageUrl || null, startsAt, endsAt]);
    created.push(result.rows[0]);
  }
  return created;
});

const updateFlashSale = async (id, data) => {
  const fields = [];
  const values = [];
  let paramCount = 1;
  const columnMap = {
    discountPercent: 'discount_percent',
    flashPrice: 'flash_price',
    stock: 'stock',
    imageUrl: 'image_url',
    startsAt: 'starts_at',
    endsAt: 'ends_at',
    subtitle: 'subtitle',
    badge: 'badge',
    themeColor: 'theme_color',
    productName: 'product_name',
    productPrice: 'product_price',
    productOldPrice: 'product_old_price',
    category: 'category',
  };

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && columnMap[key]) {
      fields.push(`${columnMap[key]} = $${paramCount++}`);
      values.push(key === 'imageUrl' && value === '' ? null : value);
    }
  }
  values.push(id);

  const res = await query(`
    UPDATE flash_sales SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);
  if (!res.rows.length) throw new AppError('Flash sale not found', 404);
  return res.rows[0];
};

const deleteFlashSale = async (id) => {
  const res = await query('DELETE FROM flash_sales WHERE id = $1 RETURNING id', [id]);
  if (!res.rows.length) throw new AppError('Flash sale not found', 404);
  return true;
};

const toggleFlashSaleActive = async (id) => {
  const res = await query(`
    UPDATE flash_sales SET is_active = NOT is_active
    WHERE id = $1 RETURNING *
  `, [id]);
  if (!res.rows.length) throw new AppError('Flash sale not found', 404);
  return res.rows[0];
};

const getDashboardStats = async () => {
  const [
    allTimeRevenueRes,
    todayRes,
    vendorsRes,
    totalOrdersRes,
    pickedUpRes,
    clientsRes,
    orderStatusesRes,
    monthlyRes,
    topVendorsRes,
    topProductsRes
  ] = await Promise.all([
    query(`
      SELECT COALESCE(SUM(total_amount), 0)::numeric AS all_time_revenue
      FROM orders
      WHERE payment_status = 'paid' OR status = 'picked_up'
    `),
    query(`
      SELECT
        COUNT(*)::int AS today_orders,
        COALESCE(SUM(total_amount), 0)::numeric AS today_revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE
    `),
    query(`
      SELECT COUNT(*)::int AS active_vendors
      FROM vendors
      WHERE validation_status = 'approved'
    `),
    query(`
      SELECT COUNT(*)::int AS total_orders
      FROM orders
    `),
    query(`
      SELECT COUNT(*)::int AS picked_up_orders
      FROM orders
      WHERE status = 'picked_up'
    `),
    query(`
      SELECT
        COUNT(*)::int AS total_clients,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::int AS new_clients_month
      FROM users
      WHERE role = 'client'
    `),
    query(`
      SELECT status, COUNT(*)::int AS count
      FROM orders
      GROUP BY status
    `),
    query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COALESCE(SUM(total_amount), 0)::numeric AS revenue,
        COUNT(*)::int AS orders
      FROM orders
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `),
    query(`
      SELECT
        v.shop_name,
        COUNT(DISTINCT oi.order_id)::int AS orders,
        COALESCE(SUM(oi.unit_price * oi.quantity), 0)::numeric AS revenue,
        COALESCE(v.avg_rating, 0)::numeric AS rating
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN vendors v ON v.id = oi.vendor_id
      WHERE o.status = 'picked_up'
        AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY v.id, v.shop_name, v.avg_rating
      ORDER BY revenue DESC
      LIMIT 5
    `),
    query(`
      SELECT
        p.title,
        COUNT(oi.id)::int AS sales_count,
        COALESCE(SUM(oi.unit_price * oi.quantity), 0)::numeric AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.title
      ORDER BY sales_count DESC
      LIMIT 5
    `)
  ]);

  const totalRevenue = Number(allTimeRevenueRes.rows[0]?.all_time_revenue || 0);
  const todayOrders = parseInt(todayRes.rows[0]?.today_orders || '0', 10);
  const todayRevenue = Number(todayRes.rows[0]?.today_revenue || 0);
  const activeVendors = parseInt(vendorsRes.rows[0]?.active_vendors || '0', 10);
  const totalOrders = parseInt(totalOrdersRes.rows[0]?.total_orders || '0', 10);
  const pickedUpOrders = parseInt(pickedUpRes.rows[0]?.picked_up_orders || '0', 10);
  const pickupRate = totalOrders > 0 ? `${((pickedUpOrders / totalOrders) * 100).toFixed(1)}%` : '0.0%';
  const totalClients = parseInt(clientsRes.rows[0]?.total_clients || '0', 10);
  const newClientsThisMonth = parseInt(clientsRes.rows[0]?.new_clients_month || '0', 10);

  // Nombre de clients connectés en live via Socket.io
  let liveConnections = 0;
  try {
    const { getIO } = require('../../config/socket');
    const io = getIO();
    if (io) liveConnections = io.engine?.clientsCount || 0;
  } catch {}

  // ─── Nouvelles métriques enrichies ────────────────────────────────────────

  // CA ce mois (hors annulations)
  let thisMonthRevenue = 0;
  try {
    const r = await query(`
      SELECT COALESCE(SUM(total_amount), 0)::numeric AS val
      FROM orders
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
        AND status != 'cancelled'
    `);
    thisMonthRevenue = Number(r.rows[0]?.val || 0);
  } catch (e) { console.warn('[stats] thisMonthRevenue skipped:', e.message); }

  // Nombre de commandes ce mois
  let thisMonthOrders = 0;
  try {
    const r = await query(`
      SELECT COUNT(*)::int AS val
      FROM orders
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `);
    thisMonthOrders = parseInt(r.rows[0]?.val || '0', 10);
  } catch (e) { console.warn('[stats] thisMonthOrders skipped:', e.message); }

  // Commandes en attente (statuts actifs)
  let pendingOrders = 0;
  try {
    const r = await query(`
      SELECT COUNT(*)::int AS val
      FROM orders
      WHERE status IN ('pending', 'confirmed', 'preparing', 'ready_for_pickup')
    `);
    pendingOrders = parseInt(r.rows[0]?.val || '0', 10);
  } catch (e) { console.warn('[stats] pendingOrders skipped:', e.message); }

  // Annulations aujourd'hui
  let cancelledToday = 0;
  try {
    const r = await query(`
      SELECT COUNT(*)::int AS val
      FROM orders
      WHERE status = 'cancelled'
        AND DATE(created_at) = CURRENT_DATE
    `);
    cancelledToday = parseInt(r.rows[0]?.val || '0', 10);
  } catch (e) { console.warn('[stats] cancelledToday skipped:', e.message); }

  // Nouveaux utilisateurs (tous rôles) ce mois
  let newUsersThisMonth = 0;
  try {
    const r = await query(`
      SELECT COUNT(*)::int AS val
      FROM users
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `);
    newUsersThisMonth = parseInt(r.rows[0]?.val || '0', 10);
  } catch (e) { console.warn('[stats] newUsersThisMonth skipped:', e.message); }

  // Top 5 produits cette semaine (avec colonnes enrichies)
  let topProductsWeekly = [];
  try {
    const r = await query(`
      SELECT
        p.title,
        SUM(oi.quantity)::int AS total_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0)::numeric AS total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= NOW() - INTERVAL '7 days'
        AND o.status != 'cancelled'
      GROUP BY p.id, p.title
      ORDER BY total_sold DESC
      LIMIT 5
    `);
    topProductsWeekly = r.rows.map((row) => ({
      title: row.title,
      totalSold: Number(row.total_sold || 0),
      totalRevenue: Number(row.total_revenue || 0),
    }));
  } catch (e) { console.warn('[stats] topProductsWeekly skipped:', e.message); }

  // Commandes par statut (alias ordersByStatus pour le PieChart)
  const ordersByStatus = orderStatusesRes.rows.map(r => ({ status: r.status, count: Number(r.count) }));

  return {
    totalRevenue,
    todayRevenue,
    todayOrders,
    totalOrders,
    activeVendors,
    totalClients,
    newClientsThisMonth,
    pickupRate,
    liveConnections,
    // ── Nouvelles métriques ──
    thisMonthRevenue,
    thisMonthOrders,
    pendingOrders,
    cancelledToday,
    newUsersThisMonth,
    ordersByStatus,
    // ── Alias rétro-compatible ──
    orderStatuses: ordersByStatus,
    revenueByMonth: monthlyRes.rows.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue || 0),
      orders: Number(row.orders || 0),
    })),
    topVendors: topVendorsRes.rows.map((row) => ({
      name: row.shop_name,
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0),
      rating: Number(row.rating || 0),
    })),
    topProducts: topProductsRes.rows.map((row) => ({
      name: row.title,
      sales: Number(row.sales_count || 0),
      revenue: Number(row.revenue || 0),
    })),
  };
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
    SELECT users.id, users.name, users.email, users.role, users.status, users.store_id,
           stores.name AS store_name, stores.city AS store_city
    FROM users
    LEFT JOIN stores ON stores.id = users.store_id
    WHERE users.role IN ('admin', 'agent')
    ORDER BY users.created_at DESC
  `);
  return res.rows;
};

const createAdmin = async (adminId, { name, email, phone, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone ? phone.trim() : null;

  const duplicate = await query(
    `SELECT id, email, phone FROM users
     WHERE LOWER(email) = $1 OR ($2::text IS NOT NULL AND phone = $2)
     LIMIT 1`,
    [normalizedEmail, normalizedPhone]
  );

  if (duplicate.rows.length) {
    const field = duplicate.rows[0].email?.toLowerCase() === normalizedEmail ? 'email' : 'phone';
    throw new AppError(`Cet ${field === 'email' ? 'email' : 'numéro de téléphone'} est déjà utilisé.`, 409, `${field.toUpperCase()}_TAKEN`);
  }

  const passwordHash = await bcrypt.hash(password, env.bcrypt.rounds);
  const result = await query(
    `INSERT INTO users (name, email, phone, password_hash, role, status)
     VALUES ($1, $2, $3, $4, 'admin', 'active')
     RETURNING id, name, email, phone, role, status, created_at`,
    [name.trim(), normalizedEmail, normalizedPhone, passwordHash]
  );

  const admin = result.rows[0];
  await logAudit('admin.admin_created', adminId, { userId: admin.id, email: admin.email });
  return admin;
};

const createAgent = async (adminId, { name, email, phone, password, storeId }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone ? phone.trim() : null;
  const store = await query(
    'SELECT id, name, city FROM stores WHERE id = $1 AND is_active = true',
    [storeId]
  );
  if (!store.rows.length) {
    throw new AppError('Le point relais sélectionné est introuvable ou désactivé.', 400, 'INVALID_STORE');
  }

  const duplicate = await query(
    `SELECT id, email, phone FROM users
     WHERE LOWER(email) = $1 OR ($2::text IS NOT NULL AND phone = $2)
     LIMIT 1`,
    [normalizedEmail, normalizedPhone]
  );

  if (duplicate.rows.length) {
    const field = duplicate.rows[0].email?.toLowerCase() === normalizedEmail ? 'email' : 'phone';
    throw new AppError(`Cet ${field === 'email' ? 'email' : 'numéro de téléphone'} est déjà utilisé.`, 409, `${field.toUpperCase()}_TAKEN`);
  }

  const passwordHash = await bcrypt.hash(password, env.bcrypt.rounds);
  const result = await query(
    `WITH inserted AS (
       INSERT INTO users (name, email, phone, password_hash, role, status, store_id)
       VALUES ($1, $2, $3, $4, 'agent', 'active', $5)
       RETURNING id, name, email, phone, role, status, store_id, created_at
     )
     SELECT inserted.*, stores.name AS store_name, stores.city AS store_city
     FROM inserted JOIN stores ON stores.id = inserted.store_id`,
    [name.trim(), normalizedEmail, normalizedPhone, passwordHash, storeId]
  );

  const agent = result.rows[0];
  await logAudit('admin.agent_created', adminId, { userId: agent.id, email: agent.email, storeId });
  return agent;
};

const assignAgentStore = async (adminId, userId, storeId) => {
  const store = await query(
    'SELECT id, name, city FROM stores WHERE id = $1 AND is_active = true',
    [storeId]
  );
  if (!store.rows.length) {
    throw new AppError('Le point relais sélectionné est introuvable ou désactivé.', 400, 'INVALID_STORE');
  }

  const result = await query(
    `UPDATE users
     SET store_id = $1, updated_at = NOW()
     WHERE id = $2 AND role = 'agent'
     RETURNING id, name, email, phone, role, status, store_id`,
    [storeId, userId]
  );
  if (!result.rows.length) throw new AppError('Agent introuvable.', 404, 'AGENT_NOT_FOUND');

  const agent = { ...result.rows[0], store_name: store.rows[0].name, store_city: store.rows[0].city };
  await logAudit('admin.agent_store_assigned', adminId, { userId, storeId });
  return agent;
};

const updateAgent = async (adminId, userId, { name, phone, storeId }) => {
  const store = await query(
    'SELECT id, name, city FROM stores WHERE id = $1 AND is_active = true',
    [storeId]
  );
  if (!store.rows.length) throw new AppError('Le point relais sélectionné est introuvable ou désactivé.', 400, 'INVALID_STORE');

  const result = await query(
    `UPDATE users
     SET name = $1, phone = $2, store_id = $3, updated_at = NOW()
     WHERE id = $4 AND role = 'agent'
     RETURNING id, name, email, phone, role, status, store_id`,
    [name.trim(), phone?.trim() || null, storeId, userId]
  );
  if (!result.rows.length) throw new AppError('Agent introuvable.', 404, 'AGENT_NOT_FOUND');

  const agent = { ...result.rows[0], store_name: store.rows[0].name, store_city: store.rows[0].city };
  await logAudit('admin.agent_updated', adminId, { userId, storeId });
  return agent;
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

// ─── Rapport hebdomadaire ─────────────────────────────────────────────────────
const getWeeklyReport = async (weekOffset = 0) => {
  // Calcul des bornes : lundi 00:00 → dimanche 23:59 de la semaine choisie
  const offset = parseInt(weekOffset, 10) || 0;
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=lun, 7=dim
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() - dayOfWeek + 1 + offset * 7);
  mondayThisWeek.setHours(0, 0, 0, 0);
  const sundayThisWeek = new Date(mondayThisWeek);
  sundayThisWeek.setDate(mondayThisWeek.getDate() + 6);
  sundayThisWeek.setHours(23, 59, 59, 999);

  const mondayPrev = new Date(mondayThisWeek);
  mondayPrev.setDate(mondayThisWeek.getDate() - 7);
  const sundayPrev = new Date(sundayThisWeek);
  sundayPrev.setDate(sundayThisWeek.getDate() - 7);

  // Commandes par jour de la semaine courante
  const { rows: dailyRows } = await query(`
    SELECT
      TO_CHAR(created_at, 'ID')::int AS day_num,
      TO_CHAR(created_at, 'YYYY-MM-DD') AS day_date,
      COUNT(*) AS orders_count,
      COALESCE(SUM(total_amount), 0) AS revenue,
      COUNT(*) FILTER (WHERE status = 'picked_up') AS completed_orders,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders
    FROM orders
    WHERE created_at >= $1 AND created_at <= $2
      AND status != 'cancelled'
    GROUP BY day_num, day_date
    ORDER BY day_num ASC
  `, [mondayThisWeek, sundayThisWeek]);

  // KPIs semaine courante
  const { rows: kpiRows } = await query(`
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(total_amount), 0) AS total_revenue,
      COUNT(*) FILTER (WHERE status = 'picked_up') AS completed_orders,
      COUNT(*) FILTER (WHERE status = 'picked_up') AS picked_up,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
      COUNT(*) FILTER (WHERE payment_method = 'cash') AS cash_orders,
      COUNT(*) FILTER (WHERE payment_method != 'cash') AS mobile_orders,
      COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'cash'), 0) AS cash_revenue,
      COALESCE(SUM(total_amount) FILTER (WHERE payment_method != 'cash'), 0) AS mobile_revenue,
      COALESCE(AVG(total_amount), 0) AS avg_order_value
    FROM orders
    WHERE created_at >= $1 AND created_at <= $2
  `, [mondayThisWeek, sundayThisWeek]);

  // KPIs semaine précédente (pour comparaison)
  const { rows: prevKpiRows } = await query(`
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(total_amount), 0) AS total_revenue,
      COUNT(*) FILTER (WHERE status = 'picked_up') AS picked_up,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
      COALESCE(AVG(total_amount), 0) AS avg_order_value
    FROM orders
    WHERE created_at >= $1 AND created_at <= $2
  `, [mondayPrev, sundayPrev]);

  // Top 5 vendeurs de la semaine
  const { rows: topVendors } = await query(`
    SELECT
      v.shop_name,
      u.name AS vendor_name,
      COUNT(DISTINCT oi.order_id) AS order_count,
      COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN vendors v ON oi.vendor_id = v.id
    JOIN users u ON v.user_id = u.id
    WHERE o.created_at >= $1 AND o.created_at <= $2
      AND o.status != 'cancelled'
    GROUP BY v.id, v.store_name, u.name
    ORDER BY revenue DESC
    LIMIT 5
  `, [mondayThisWeek, sundayThisWeek]);

  // Top 5 produits de la semaine
  const { rows: topProducts } = await query(`
    SELECT
      oi.title,
      SUM(oi.quantity) AS qty_sold,
      COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= $1 AND o.created_at <= $2
      AND o.status != 'cancelled'
    GROUP BY oi.title
    ORDER BY qty_sold DESC
    LIMIT 5
  `, [mondayThisWeek, sundayThisWeek]);

  const kpi = kpiRows[0] || {};
  const prevKpi = prevKpiRows[0] || {};

  const safeNumber = (value) => parseFloat(value) || 0;

  const pct = (curr, prev) => {
    const c = safeNumber(curr);
    const p = safeNumber(prev);
    if (p === 0) return c > 0 ? 100 : 0;
    return Math.round(((c - p) / p) * 100);
  };

  // Construire un tableau Lun–Dim avec 0 si pas de données
  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dailyMap = {};
  dailyRows.forEach(r => { dailyMap[r.day_num] = r; });
  const daily = DAYS.map((label, i) => ({
    label,
    date: dailyMap[i + 1]?.day_date || null,
    orders: parseInt(dailyMap[i + 1]?.orders_count || 0, 10),
    revenue: parseFloat(dailyMap[i + 1]?.revenue || 0),
    completed_orders: parseInt(dailyMap[i + 1]?.completed_orders || 0, 10),
    cancelled_orders: parseInt(dailyMap[i + 1]?.cancelled_orders || 0, 10),
  }));

  const bestDay = daily.reduce((best, current) => {
    if (!best) return current;
    if (current.revenue > best.revenue) return current;
    if (current.revenue === best.revenue && current.orders > best.orders) return current;
    return best;
  }, null) || { label: null, date: null, orders: 0, revenue: 0 };

  const totalOrders = parseInt(kpi.total_orders || 0, 10);
  const totalRevenue = safeNumber(kpi.total_revenue);
  const totalCancelled = parseInt(kpi.cancelled || 0, 10);
  const completedOrders = parseInt(kpi.completed_orders || kpi.picked_up || 0, 10);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const cancelRate = totalOrders > 0 ? Math.round((totalCancelled / totalOrders) * 100) : 0;

  const previousCompletedOrders = parseInt(prevKpi.picked_up || 0, 10);
  const previousCancelled = parseInt(prevKpi.cancelled || 0, 10);
  const previousOrders = parseInt(prevKpi.total_orders || 0, 10);
  const previousRevenue = safeNumber(prevKpi.total_revenue);

  return {
    week: {
      start: mondayThisWeek.toISOString().slice(0, 10),
      end: sundayThisWeek.toISOString().slice(0, 10),
      offset,
    },
    daily,
    summary: {
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      completed_orders: completedOrders,
      cancelled_orders: totalCancelled,
      cancel_rate: cancelRate,
      avg_order_value: avgOrderValue,
      best_day: {
        label: bestDay.label,
        date: bestDay.date,
        orders: bestDay.orders,
        revenue: bestDay.revenue,
      },
    },
    kpi: {
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      completed_orders: completedOrders,
      picked_up: completedOrders,
      cancelled: totalCancelled,
      cash_orders: parseInt(kpi.cash_orders || 0, 10),
      mobile_orders: parseInt(kpi.mobile_orders || 0, 10),
      cash_revenue: safeNumber(kpi.cash_revenue),
      mobile_revenue: safeNumber(kpi.mobile_revenue),
      avg_basket: avgOrderValue,
      avg_order_value: avgOrderValue,
      cancel_rate: cancelRate,
    },
    vs_prev: {
      orders_pct: pct(totalOrders, previousOrders),
      revenue_pct: pct(totalRevenue, previousRevenue),
      picked_up_pct: pct(completedOrders, previousCompletedOrders),
      completed_pct: pct(completedOrders, previousCompletedOrders),
      cancelled_pct: pct(totalCancelled, previousCancelled),
      avg_order_value_pct: pct(avgOrderValue, safeNumber(prevKpi.avg_order_value)),
      cancel_rate_pct: pct(cancelRate, previousOrders > 0 ? Math.round((previousCancelled / previousOrders) * 100) : 0),
    },
    top_vendors: topVendors.map(v => ({
      name: v.shop_name || v.vendor_name,
      order_count: parseInt(v.order_count, 10),
      revenue: parseFloat(v.revenue),
    })),
    top_products: topProducts.map(p => ({
      title: p.title,
      qty_sold: parseInt(p.qty_sold, 10),
      revenue: parseFloat(p.revenue),
    })),
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
  createFlashSales,
  updateFlashSale,
  deleteFlashSale,
  toggleFlashSaleActive,
  getDashboardStats,
  getPlatformSettings,
  updateSetting,
  getUserRoles,
  createAdmin,
  createAgent,
  assignAgentStore,
  updateAgent,
  assignRole,
  getAuditLogs,
  getWeeklyReport,
};
