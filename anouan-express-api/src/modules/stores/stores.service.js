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
      SELECT * FROM stores
      ${whereClause}
      ORDER BY id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await query(sql, params);
    
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getById(id) {
    const { rows } = await query('SELECT * FROM stores WHERE id = $1', [id]);
    if (!rows[0]) throw new AppError('Store not found', 404);
    return rows[0];
  }

  async create(data) {
    const { name, address, city, phone, contact_email, is_active } = data;
    const sql = `
      INSERT INTO stores (name, address, city, phone, contact_email, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows } = await query(sql, [name, address, city, phone, contact_email, is_active !== false]);
    return rows[0];
  }

  async update(id, data) {
    const store = await this.getById(id);
    const updates = { ...store, ...data };
    const sql = `
      UPDATE stores
      SET name = $1, address = $2, city = $3, phone = $4, contact_email = $5, is_active = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    const { rows } = await query(sql, [
      updates.name, updates.address, updates.city, updates.phone, updates.contact_email, updates.is_active, id
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
}

module.exports = new StoresService();
