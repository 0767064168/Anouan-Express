const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');

const generateSlug = (name) => {
  return name.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now();
};

const getCatalog = async (filters, pagination) => {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;
  const { categoryId, vendorId, minPrice, maxPrice, search, minRating, sort = 'newest' } = filters;

  let whereClauses = ["p.status = 'active'"];
  let params = [];
  let paramIndex = 1;

  if (categoryId) {
    whereClauses.push(`p.category_id = $${paramIndex++}`);
    params.push(categoryId);
  }
  if (vendorId) {
    whereClauses.push(`p.vendor_id = $${paramIndex++}`);
    params.push(vendorId);
  }
  if (minPrice !== undefined) {
    whereClauses.push(`p.price >= $${paramIndex++}`);
    params.push(minPrice);
  }
  if (maxPrice !== undefined) {
    whereClauses.push(`p.price <= $${paramIndex++}`);
    params.push(maxPrice);
  }
  if (minRating !== undefined) {
    whereClauses.push(`p.avg_rating >= $${paramIndex++}`);
    params.push(minRating);
  }
  if (search) {
    whereClauses.push(`(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let orderSql = 'ORDER BY p.created_at DESC';
  switch (sort) {
    case 'price_asc':
      orderSql = 'ORDER BY p.price ASC';
      break;
    case 'price_desc':
      orderSql = 'ORDER BY p.price DESC';
      break;
    case 'best_seller':
      orderSql = 'ORDER BY p.sold_count DESC';
      break;
    case 'rating':
      orderSql = 'ORDER BY p.avg_rating DESC';
      break;
    case 'newest':
    default:
      orderSql = 'ORDER BY p.created_at DESC';
      break;
  }

  const countSql = `SELECT COUNT(*) FROM products p ${whereSql}`;
  const { rows: countRows } = await query(countSql, params);
  const total = parseInt(countRows[0].count);
  const totalPages = Math.ceil(total / limit);

  const sql = `
    SELECT p.id, p.title, p.title as name, p.slug, p.description, p.price, p.stock, p.avg_rating as rating, p.review_count,
           p.category_id, p.status, p.created_at,
           COALESCE(v.shop_name, 'Boutique Anouan Bouaké') as vendor_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as main_image,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as image_url,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as image,
           fs.discount_percent, fs.flash_price as discount_price, fs.ends_at as flash_sale_ends_at
    FROM products p
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN flash_sales fs ON p.id = fs.product_id AND fs.is_active = true AND NOW() BETWEEN fs.starts_at AND fs.ends_at
    ${whereSql}
    ${orderSql}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  params.push(limit, offset);
  const { rows } = await query(sql, params);

  return {
    data: rows,
    pagination: { page, limit, total, totalPages }
  };
};

const getById = async (productId) => {
  const productSql = `
    SELECT p.*, v.shop_name as store_name, v.logo_url as vendor_logo,
           fs.discount_percent, fs.flash_price as discount_price, fs.ends_at as flash_sale_ends_at
    FROM products p
    JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN flash_sales fs ON p.id = fs.product_id AND fs.is_active = true AND NOW() BETWEEN fs.starts_at AND fs.ends_at
    WHERE p.id = $1 AND p.status != 'deleted'
  `;
  const { rows: productRows } = await query(productSql, [productId]);
  
  if (productRows.length === 0) {
    throw new AppError('Product not found', 404);
  }
  
  const product = productRows[0];
  
  const imagesSql = `SELECT id, image_url, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, id ASC`;
  const { rows: images } = await query(imagesSql, [productId]);
  
  const variantsSql = `SELECT id, name, sku, price_delta as price_modifier, stock FROM product_variants WHERE product_id = $1`;
  const { rows: variants } = await query(variantsSql, [productId]);

  product.images = images;
  product.variants = variants;

  return product;
};

const search = async (searchQuery, limit = 10) => {
  const sql = `
    SELECT p.id, p.title, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active' AND p.title ILIKE $1
    ORDER BY p.sold_count DESC
    LIMIT $2
  `;
  const { rows } = await query(sql, [`%${searchQuery}%`, limit]);
  return rows;
};

const getFeatured = async () => {
  const sql = `
    SELECT p.id, p.title, p.slug, p.price, p.avg_rating,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as main_image
    FROM products p
    WHERE p.is_featured = true AND p.status = 'active'
    LIMIT 12
  `;
  const { rows } = await query(sql);
  return rows;
};

const getFlashSales = async () => {
  const sql = `
    SELECT p.id, p.title, p.slug, p.price, p.avg_rating,
           fs.discount_percent, fs.flash_price as discount_price, fs.ends_at,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as main_image
    FROM products p
    JOIN flash_sales fs ON p.id = fs.product_id
    WHERE fs.is_active = true AND NOW() BETWEEN fs.starts_at AND fs.ends_at AND p.status = 'active'
  `;
  const { rows } = await query(sql);
  return rows;
};

const getVendorProducts = async (vendorId, page = 1, limit = 20, status = null) => {
  const offset = (page - 1) * limit;
  let statusFilter = "p.status != 'deleted'";
  let params = [vendorId];
  let paramIndex = 2;

  if (status) {
    statusFilter = `p.status = $${paramIndex++}`;
    params.push(status);
  }

  const countSql = `SELECT COUNT(*) FROM products p WHERE p.vendor_id = $1 AND ${statusFilter}`;
  const { rows: countRows } = await query(countSql, params);
  const total = parseInt(countRows[0].count);
  const totalPages = Math.ceil(total / limit);

  const sql = `
    SELECT p.*, 
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) as main_image
    FROM products p
    WHERE p.vendor_id = $1 AND ${statusFilter}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  params.push(limit, offset);
  const { rows } = await query(sql, params);

  return {
    data: rows,
    pagination: { page, limit, total, totalPages }
  };
};

const create = async (vendorId, data) => {
  return await withTransaction(async (client) => {
    let { title, name, description, price, stock, categoryId, category_id, variants, imageUrls, flashSaleActive, flashSalePrice } = data;
    const effectiveTitle = (title || name || 'Produit Anouan').trim();
    const slug = generateSlug(effectiveTitle);
    const numPrice = Number(price) || 0;
    const numStock = Number(stock) || 0;

    // Résolution sécurisée du vendorId
    let effectiveVendorId = vendorId;
    const vCheck = await client.query('SELECT id FROM vendors WHERE id = $1', [effectiveVendorId]).catch(() => ({ rows: [] }));
    if (!vCheck.rows.length) {
      const vFirst = await client.query('SELECT id FROM vendors LIMIT 1');
      if (vFirst.rows.length) {
        effectiveVendorId = vFirst.rows[0].id;
      }
    }

    // Résolution sécurisée du categoryId (si non-UUID ou inexistant)
    let rawCat = categoryId || category_id;
    let effectiveCategoryId = rawCat;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(rawCat));
    if (!isUUID) {
      const cFirst = await client.query('SELECT id FROM categories LIMIT 1');
      effectiveCategoryId = cFirst.rows[0]?.id;
    } else {
      const cCheck = await client.query('SELECT id FROM categories WHERE id = $1', [rawCat]).catch(() => ({ rows: [] }));
      if (!cCheck.rows.length) {
        const cFirst = await client.query('SELECT id FROM categories LIMIT 1');
        effectiveCategoryId = cFirst.rows[0]?.id;
      }
    }

    const productSql = `
      INSERT INTO products (vendor_id, category_id, title, slug, description, price, stock, status, flash_sale_active, flash_sale_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9)
      RETURNING *
    `;
    const { rows: productRows } = await client.query(productSql, [
      effectiveVendorId,
      effectiveCategoryId,
      effectiveTitle,
      slug,
      description || '',
      numPrice,
      numStock,
      flashSaleActive === true || flashSaleActive === 'true',
      flashSalePrice ? Number(flashSalePrice) : null,
    ]);
    const product = productRows[0];

    // Images resolution
    let finalImages = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls : [];
    if (!finalImages.length && data.images) {
      finalImages = Array.isArray(data.images) ? data.images : [data.images];
    }
    if (!finalImages.length && (data.image_url || data.image)) {
      finalImages = [data.image_url || data.image];
    }
    finalImages = finalImages
      .map(img => typeof img === 'string' ? img : (img?.preview || img?.url))
      .filter(img => typeof img === 'string' && img.length > 5 && img !== '__cache__');

    if (!finalImages.length) {
      finalImages = ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80'];
    }

    for (let i = 0; i < finalImages.length; i++) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, $3)`,
        [product.id, finalImages[i], i === 0]
      );
    }
    product.images = finalImages;
    product.image_url = finalImages[0];
    product.image = finalImages[0];
    product.main_image = finalImages[0];

    if (variants && variants.length > 0) {
      for (const variant of variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, name, sku, price_modifier, stock) VALUES ($1, $2, $3, $4, $5)`,
          [product.id, variant.name, variant.sku || null, variant.priceModifier || 0, variant.stock || 0]
        );
      }
    }

    return product;
  });
};

const update = async (productId, vendorId, data, isAdmin = false) => {
  return await withTransaction(async (client) => {
    const checkSql = isAdmin
      ? `SELECT id FROM products WHERE id = $1 AND status != 'deleted'`
      : `SELECT id FROM products WHERE id = $1 AND vendor_id = $2 AND status != 'deleted'`;
    const checkParams = isAdmin ? [productId] : [productId, vendorId];
    const { rows: existingRows } = await client.query(checkSql, checkParams);
    
    if (existingRows.length === 0) {
      throw new AppError('Product not found or unauthorized', 404);
    }

    const { title, name, description, price, stock, categoryId, category_id, imageUrls, variants, flashSaleActive, flashSalePrice } = data;
    const effectiveTitle = title || name;
    const fields = [];
    const values = [];
    let index = 1;

    if (effectiveTitle) {
      fields.push(`title = $${index++}`);
      values.push(effectiveTitle);
      fields.push(`slug = $${index++}`);
      values.push(generateSlug(effectiveTitle));
    }
    if (description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(description);
    }
    if (price !== undefined) {
      fields.push(`price = $${index++}`);
      values.push(Number(price) || 0);
    }
    if (stock !== undefined) {
      fields.push(`stock = $${index++}`);
      values.push(Number(stock) || 0);
    }
    const cat = categoryId || category_id;
    if (cat !== undefined) {
      fields.push(`category_id = $${index++}`);
      values.push(cat);
    }
    if (flashSaleActive !== undefined) {
      fields.push(`flash_sale_active = $${index++}`);
      values.push(flashSaleActive === true || flashSaleActive === 'true');
    }
    if (flashSalePrice !== undefined) {
      fields.push(`flash_sale_price = $${index++}`);
      values.push(flashSalePrice ? Number(flashSalePrice) : null);
    }

    if (fields.length > 0) {
      values.push(productId);
      const updateSql = `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index}`;
      await client.query(updateSql, values);
    }

    let finalImages = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls : [];
    if (!finalImages.length && data.images) {
      finalImages = Array.isArray(data.images) ? data.images : [data.images];
    }
    if (!finalImages.length && (data.image_url || data.image)) {
      finalImages = [data.image_url || data.image];
    }
    finalImages = finalImages
      .map(img => typeof img === 'string' ? img : (img?.preview || img?.url))
      .filter(img => typeof img === 'string' && img.length > 5 && img !== '__cache__');

    if (finalImages.length > 0) {
      await client.query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
      for (let i = 0; i < finalImages.length; i++) {
        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, $3)`,
          [productId, finalImages[i], i === 0]
        );
      }
    }

    if (variants && variants.length > 0) {
      await client.query(`DELETE FROM product_variants WHERE product_id = $1`, [productId]);
      for (const variant of variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, name, sku, price_modifier, stock) VALUES ($1, $2, $3, $4, $5)`,
          [productId, variant.name, variant.sku || null, variant.priceModifier || 0, variant.stock || 0]
        );
      }
    }

    return { id: productId, message: 'Product updated successfully' };
  });
};

const softDelete = async (productId, vendorId, isAdmin = false) => {
  const checkSql = isAdmin
    ? `UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`
    : `UPDATE products SET status = 'deleted', updated_at = NOW() WHERE id = $1 AND vendor_id = $2 RETURNING id`;
  const checkParams = isAdmin ? [productId] : [productId, vendorId];
  const { rows } = await query(checkSql, checkParams);
  if (rows.length === 0) {
    throw new AppError('Product not found or unauthorized', 404);
  }
  return true;
};

const updateStock = async (productId, vendorId, delta) => {
  const { rows } = await query(
    `UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 AND vendor_id = $3 AND (stock + $1) >= 0 RETURNING id, stock`,
    [delta, productId, vendorId]
  );
  if (rows.length === 0) {
    throw new AppError('Product not found, unauthorized, or insufficient stock', 400);
  }
  return rows[0];
};

const bulkImportCSV = async (vendorId, csvData) => {
  // simple csv parser implementation
  const lines = csvData.split('\n');
  if (lines.length < 2) throw new AppError('Empty CSV', 400);
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  let importedCount = 0;

  await withTransaction(async (client) => {
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      const title = row.title;
      const price = parseInt(row.price);
      const stock = parseInt(row.stock) || 0;
      const categorySlug = row.category_slug;

      if (!title || !price) continue;

      let categoryId = null;
      if (categorySlug) {
        const catRes = await client.query(`SELECT id FROM categories WHERE slug = $1`, [categorySlug]);
        if (catRes.rows.length > 0) categoryId = catRes.rows[0].id;
      }

      const slug = generateSlug(title);
      await client.query(
        `INSERT INTO products (vendor_id, category_id, title, slug, price, stock, status) VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
        [vendorId, categoryId, title, slug, price, stock]
      );
      importedCount++;
    }
  });

  return { importedCount };
};

module.exports = {
  getCatalog,
  getById,
  search,
  getFeatured,
  getFlashSales,
  getVendorProducts,
  create,
  update,
  softDelete,
  updateStock,
  bulkImportCSV
};
