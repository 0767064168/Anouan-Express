const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

class StoresService {
  async getAll(isActiveOnly = true, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [];
    
    if (isActiveOnly) {
      whereClause = 'WHERE is_active = $1';
      params.push(true);
    }
    
    const countSql = `SELECT COUNT(*) FROM stores ${whereClause}`;
    const { rows: countRows } = await query(countSql, params);
    const total = parseInt(countRows[0].count, 10);
    
    params.push(limit, offset);
    const sql = `
      SELECT stores.*,
        COUNT(DISTINCT users.id) FILTER (WHERE users.role = 'agent')::int AS agent_count,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', users.id, 'name', users.name, 'phone', users.phone, 'email', users.email, 'status', users.status)
          ) FILTER (WHERE users.id IS NOT NULL AND users.role = 'agent'),
          '[]'::json
        ) AS agents
      FROM stores
      LEFT JOIN users ON users.store_id = stores.id AND users.role = 'agent'
      ${isActiveOnly ? 'WHERE stores.is_active = $1' : ''}
      GROUP BY stores.id
      ORDER BY stores.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await query(sql, params);
    
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getById(id) {
    const sql = `
      SELECT stores.*,
        COUNT(DISTINCT users.id) FILTER (WHERE users.role = 'agent')::int AS agent_count,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', users.id, 'name', users.name, 'phone', users.phone, 'email', users.email, 'status', users.status)
          ) FILTER (WHERE users.id IS NOT NULL AND users.role = 'agent'),
          '[]'::json
        ) AS agents
      FROM stores
      LEFT JOIN users ON users.store_id = stores.id AND users.role = 'agent'
      WHERE stores.id = $1
      GROUP BY stores.id
    `;
    const { rows } = await query(sql, [id]);
    if (!rows[0]) throw new AppError('Store not found', 404);
    return rows[0];
  }

  async create(data) {
    const { name, address, city, phone, contact_email, gps_lat, gps_lng, is_active } = data;
    const sql = `
      INSERT INTO stores (name, address, city, phone, contact_email, gps_lat, gps_lng, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      name,
      address,
      city,
      phone || null,
      contact_email || null,
      gps_lat !== undefined ? gps_lat : null,
      gps_lng !== undefined ? gps_lng : null,
      is_active !== false,
    ]);
    return rows[0];
  }

  async update(id, data) {
    const store = await this.getById(id);
    const updates = { ...store, ...data };
    const sql = `
      UPDATE stores
      SET name = $1, address = $2, city = $3, phone = $4, contact_email = $5,
          gps_lat = $6, gps_lng = $7, is_active = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    const { rows } = await query(sql, [
      updates.name,
      updates.address,
      updates.city,
      updates.phone || null,
      updates.contact_email || null,
      updates.gps_lat !== undefined ? updates.gps_lat : null,
      updates.gps_lng !== undefined ? updates.gps_lng : null,
      updates.is_active,
      id
    ]);
    return rows[0];
  }

  async toggleActive(id) {
    const store = await this.getById(id);
    const sql = `
      UPDATE stores
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await query(sql, [!store.is_active, id]);
    return rows[0];
  }

  async delete(id) {
    await this.getById(id);
    const sql = 'DELETE FROM stores WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0];
  }
}

module.exports = new StoresService();
