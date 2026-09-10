const { query } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const generateSlug = (name) => {
  return name.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
};

const getAll = async () => {
  const sql = `
    SELECT id, name, slug, icon, image_url, parent_id, sort_order, is_active 
    FROM categories 
    WHERE is_active = true 
    ORDER BY sort_order ASC, name ASC
  `;
  const { rows } = await query(sql);

  // Build tree
  const categoryMap = {};
  const rootCategories = [];

  rows.forEach(row => {
    categoryMap[row.id] = { ...row, children: [] };
  });

  rows.forEach(row => {
    if (row.parent_id) {
      if (categoryMap[row.parent_id]) {
        categoryMap[row.parent_id].children.push(categoryMap[row.id]);
      }
    } else {
      rootCategories.push(categoryMap[row.id]);
    }
  });

  return rootCategories;
};

const getById = async (id) => {
  const sql = `
    SELECT id, name, slug, icon, image_url, parent_id, sort_order, is_active 
    FROM categories 
    WHERE id = $1 AND is_active = true
  `;
  const { rows } = await query(sql, [id]);

  if (rows.length === 0) {
    throw new AppError('Category not found', 404);
  }

  return rows[0];
};

const create = async (data) => {
  const { name, icon, imageUrl, parentId, sortOrder } = data;
  const slug = generateSlug(name);

  const sql = `
    INSERT INTO categories (name, slug, icon, image_url, parent_id, sort_order, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING id, name, slug, icon, image_url, parent_id, sort_order, is_active
  `;
  
  const { rows } = await query(sql, [
    name, 
    slug, 
    icon || null, 
    imageUrl || null, 
    parentId || null, 
    sortOrder || 0
  ]);
  
  return rows[0];
};

const update = async (id, data) => {
  // Check if exists
  await getById(id);

  const fields = [];
  const values = [];
  let index = 1;

  if (data.name) {
    fields.push(`name = $${index++}`);
    values.push(data.name);
    fields.push(`slug = $${index++}`);
    values.push(generateSlug(data.name));
  }
  
  if (data.icon !== undefined) {
    fields.push(`icon = $${index++}`);
    values.push(data.icon);
  }

  if (data.imageUrl !== undefined) {
    fields.push(`image_url = $${index++}`);
    values.push(data.imageUrl);
  }

  if (data.parentId !== undefined) {
    fields.push(`parent_id = $${index++}`);
    values.push(data.parentId);
  }

  if (data.sortOrder !== undefined) {
    fields.push(`sort_order = $${index++}`);
    values.push(data.sortOrder);
  }
  
  if (data.isActive !== undefined) {
    fields.push(`is_active = $${index++}`);
    values.push(data.isActive);
  }

  if (fields.length === 0) {
    return getById(id);
  }

  values.push(id);
  const sql = `
    UPDATE categories 
    SET ${fields.join(', ')}, updated_at = NOW() 
    WHERE id = $${index} 
    RETURNING id, name, slug, icon, image_url, parent_id, sort_order, is_active
  `;

  const { rows } = await query(sql, values);
  return rows[0];
};

const remove = async (id) => {
  // Check if exists
  await getById(id);

  // Check if there are products using this category
  const productsQuery = `SELECT COUNT(*) FROM products WHERE category_id = $1 AND status != 'deleted'`;
  const { rows: productRows } = await query(productsQuery, [id]);

  if (parseInt(productRows[0].count) > 0) {
    throw new AppError('Cannot delete category with associated active products', 400);
  }

  const sql = `UPDATE categories SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`;
  await query(sql, [id]);
  return true;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  generateSlug
};
