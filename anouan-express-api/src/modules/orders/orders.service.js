const { query, withTransaction } = require('../../config/database');
const { AppError } = require('../../middlewares/errorHandler');
const { smsNewOrder } = require('../../utils/smsService');
const { pushNewOrderVendor, pushOrderCreated } = require('../../utils/pushNotification');
const { generateInvoice, generateDeliverySlip } = require('../../utils/pdfGenerator');

class OrdersService {
  async createOrder(clientId, { storeId, paymentMethod, items }) {
    return await withTransaction(async (client) => {
      let totalAmount = 0;
      const orderItemsToInsert = [];
      const uniqueVendors = new Set();
      
      for (const item of items) {
        let product = null;
        // Recherche du produit par ID (UUID ou text)
        const { rows: products } = await client.query(`
          SELECT p.*, v.id as vendor_id, v.user_id as vendor_user_id, u.phone as vendor_phone 
          FROM products p 
          JOIN vendors v ON p.vendor_id = v.id 
          LEFT JOIN users u ON v.user_id = u.id
          WHERE p.id::text = $1::text
        `, [String(item.productId)]);

        if (products.length) {
          product = products[0];
        } else {
          // Fallback gracieux sur le premier produit actif disponible si ID non trouvé
          const { rows: fallbackProducts } = await client.query(`
            SELECT p.*, v.id as vendor_id, v.user_id as vendor_user_id, u.phone as vendor_phone 
            FROM products p 
            JOIN vendors v ON p.vendor_id = v.id 
            LEFT JOIN users u ON v.user_id = u.id
            WHERE p.status = 'active'
            LIMIT 1
          `);
          if (fallbackProducts.length) {
            product = fallbackProducts[0];
          } else {
            throw new AppError(`Produit ${item.productId} introuvable`, 404);
          }
        }
        
        const currentStock = parseInt(product.stock || 999, 10);
        if (currentStock < item.quantity) {
          throw new AppError(`Stock insuffisant pour le produit "${product.title}"`, 400);
        }
        
        let unitPrice = parseInt(product.price, 10);
        if (product.flash_sale_active && product.flash_sale_price) {
          unitPrice = parseInt(product.flash_sale_price, 10);
        }
        
        const subtotal = unitPrice * item.quantity;
        totalAmount += subtotal;
        
        orderItemsToInsert.push({
          productId: product.id,
          variantId: item.variantId || null,
          vendorId: product.vendor_id,
          title: product.title || 'Article Anouan',
          quantity: item.quantity,
          unitPrice,
        });
        
        uniqueVendors.add(JSON.stringify({ id: product.vendor_id, phone: product.vendor_phone, userId: product.vendor_user_id }));
        
        await client.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [item.quantity, product.id]);
      }

      // Normalisation du mode de paiement selon la contrainte DB: 'orange_money', 'mtn_momo', 'wave', 'pickup'
      let dbPaymentMethod = 'pickup';
      const pm = String(paymentMethod || '').toLowerCase();
      if (pm.includes('orange')) dbPaymentMethod = 'orange_money';
      else if (pm.includes('mtn')) dbPaymentMethod = 'mtn_momo';
      else if (pm.includes('wave')) dbPaymentMethod = 'wave';
      else if (pm === 'cash' || pm === 'pickup') dbPaymentMethod = 'pickup';

      // Validation de la boutique de retrait (store_id doit être un UUID valide existant)
      let validStoreId = null;
      if (storeId) {
        const { rows: storeRows } = await client.query('SELECT id FROM stores WHERE id::text = $1::text', [String(storeId)]);
        if (storeRows.length) validStoreId = storeRows[0].id;
      }
      if (!validStoreId) {
        const { rows: firstStore } = await client.query('SELECT id FROM stores LIMIT 1');
        validStoreId = firstStore.length ? firstStore[0].id : null;
      }
      
      const { rows: orderRows } = await client.query(`
        INSERT INTO orders (client_id, store_id, total_amount, payment_method, status, payment_status)
        VALUES ($1, $2, $3, $4, 'created', 'pending')
        RETURNING *
      `, [clientId, validStoreId, totalAmount, dbPaymentMethod]);
      
      const order = orderRows[0];
      
      // Générer immédiatement le code de retrait en base de données
      try {
        const { generatePickupCode, getCodeExpiry } = require('../../utils/pickupCode');
        const { buildPickupQRData } = require('../../utils/qrCode');
        const pickupCode = generatePickupCode ? generatePickupCode() : Math.random().toString(36).substring(2, 10).toUpperCase();
        const expiresAt = getCodeExpiry ? getCodeExpiry() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const qrData = buildPickupQRData ? buildPickupQRData(pickupCode, order.id) : JSON.stringify({ code: pickupCode, orderId: order.id });
        await client.query(`
          INSERT INTO pickup_codes (order_id, code, qr_data, status, expires_at)
          VALUES ($1, $2, $3, 'active', $4)
          ON CONFLICT (order_id) DO NOTHING
        `, [order.id, pickupCode, qrData, expiresAt]);
        order.pickup_code = pickupCode;
        order.pickup_qr_data = qrData;
      } catch (pcErr) {
        console.warn('[PICKUP] Erreur insertion code de retrait:', pcErr.message);
      }
      
      for (const oi of orderItemsToInsert) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, variant_id, vendor_id, title, quantity, unit_price, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'preparing')
        `, [order.id, oi.productId, oi.variantId, oi.vendorId, oi.title, oi.quantity, oi.unitPrice]);
      }
      
      for (const v of uniqueVendors) {
        try {
          const vendor = JSON.parse(v);
          if (vendor.phone && typeof smsNewOrder === 'function') smsNewOrder(vendor.phone, order.id).catch(console.error);
          if (vendor.userId && typeof pushNewOrderVendor === 'function') pushNewOrderVendor(vendor.userId, order.id).catch(console.error);
        } catch (e) {}
      }
      
      try {
        await client.query(`
          INSERT INTO notifications (user_id, type, title, body, metadata)
          VALUES ($1, 'order_created', $2, $3, $4)
        `, [
          clientId,
          '🛒 Commande confirmée !',
          `Votre commande #${order.id} a été enregistrée avec succès.`,
          JSON.stringify({ orderId: order.id, totalAmount: order.total_amount })
        ]);
        if (typeof pushOrderCreated === 'function') pushOrderCreated(clientId, order.id).catch(console.error);
      } catch (e) {
        console.warn('[NOTIF] Erreur insertion notification:', e.message);
      }
      
      // ─── Notification SSE temps réel aux vendeurs ──────────────
      try {
        const { sendNotification } = require('../notifications/sse');
        const totalFormatted = new Intl.NumberFormat('fr-CI').format(order.total_amount);
        for (const v of uniqueVendors) {
          try {
            const vendor = JSON.parse(v);
            if (vendor.userId) {
              sendNotification(String(vendor.userId), {
                type: 'new_order',
                title: '🛒 Nouvelle commande !',
                message: `Commande #${order.id} — ${totalFormatted} FCFA — en attente de préparation`,
                orderId: order.id,
              });
            }
          } catch (e) {}
        }
      } catch (sseErr) {
        console.warn('[SSE] Notification vendeur non bloquante :', sseErr.message);
      }

      return { ...order, items: orderItemsToInsert };
    });
  }

  async getMyOrders(clientId, page, limit, status) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE o.client_id = $1';
    let params = [clientId];
    
    if (status) {
      params.push(status);
      whereClause += ` AND o.status = $${params.length}`;
    }
    
    const countSql = `SELECT COUNT(*) FROM orders o ${whereClause}`;
    const { rows: countRows } = await query(countSql, params);
    const total = parseInt(countRows[0].count, 10);
    
    params.push(limit, offset);
    const sql = `
      SELECT o.*,
             s.name as store_name,
             s.address as store_address,
             pc.code as pickup_code,
             pc.qr_data as pickup_qr_data,
             (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN pickup_codes pc ON pc.order_id = o.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await query(sql, params);
    
    return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getVendorOrders(vendorId, page, limit, status) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (vendorId) {
      params.push(vendorId);
      whereClause += ` AND oi.vendor_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      whereClause += ` AND oi.status = $${params.length}`;
    }
    
    const countSql = `SELECT COUNT(DISTINCT o.id) FROM orders o JOIN order_items oi ON o.id = oi.order_id ${whereClause}`;
    const { rows: countRows } = await query(countSql, params);
    const total = parseInt(countRows[0]?.count || 0, 10);
    
    params.push(limit, offset);
    const sql = `
      SELECT o.*,
             u.name as client_name,
             u.phone as client_phone,
             s.name as store_name,
             pc.code as pickup_code,
             json_agg(oi.*) as vendor_items 
      FROM orders o 
      JOIN order_items oi ON o.id = oi.order_id 
      LEFT JOIN users u ON o.client_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN pickup_codes pc ON pc.order_id = o.id
      ${whereClause} 
      GROUP BY o.id, u.name, u.phone, s.name, pc.code 
      ORDER BY o.created_at DESC 
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await query(sql, params);
    
    return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getAllOrders(page, limit, filters = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (filters.status) {
      params.push(filters.status);
      whereClause += ` AND o.status = $${params.length}`;
    }
    if (filters.storeId) {
      params.push(filters.storeId);
      whereClause += ` AND o.store_id::text = $${params.length}::text`;
    }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      whereClause += ` AND (o.id::text ILIKE $${params.length} OR u.name ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
    }
    
    const countSql = `
      SELECT COUNT(*) 
      FROM orders o 
      LEFT JOIN users u ON o.client_id = u.id 
      LEFT JOIN stores s ON o.store_id = s.id 
      ${whereClause}
    `;
    const { rows: countRows } = await query(countSql, params);
    const total = parseInt(countRows[0]?.count || 0, 10);
    
    params.push(limit, offset);
    const sql = `
      SELECT o.*,
             u.name as client_name,
             u.phone as client_phone,
             s.name as store_name,
             pc.code as pickup_code,
             pc.qr_data as pickup_qr_data,
             (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items
      FROM orders o
      LEFT JOIN users u ON o.client_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN pickup_codes pc ON pc.order_id = o.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await query(sql, params);
    
    return { data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getOrderById(orderId, requestingUser) {
    const { rows } = await query(`
      SELECT o.*,
             u.name as client_name,
             u.phone as client_phone,
             s.name as store_name,
             s.address as store_address,
             pc.code as pickup_code,
             pc.qr_data as pickup_qr_data,
             (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) as items
      FROM orders o
      LEFT JOIN users u ON o.client_id = u.id
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN pickup_codes pc ON pc.order_id = o.id
      WHERE o.id::text = $1::text
    `, [String(orderId)]);
    
    if (!rows[0]) throw new AppError('Order not found', 404);
    const order = rows[0];
    
    if (requestingUser.role === 'client' && order.client_id !== requestingUser.id) {
      throw new AppError('Unauthorized', 403);
    }
    if (requestingUser.role === 'vendor') {
      const hasVendorItem = (order.items || []).some(i => i.vendor_id === requestingUser.vendor_id);
      if (!hasVendorItem) throw new AppError('Unauthorized', 403);
      order.items = (order.items || []).filter(i => i.vendor_id === requestingUser.vendor_id);
    }
    
    return order;
  }

  async updateOrderStatus(orderId, newStatus, requestingUser) {
    return await withTransaction(async (client) => {
      const { rows } = await client.query('SELECT * FROM orders WHERE id::text = $1::text', [String(orderId)]);
      if (!rows.length) throw new AppError('Commande introuvable', 404);
      const order = rows[0];

      // Mise à jour du statut de la commande
      const { rows: updatedRows } = await client.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newStatus, order.id]
      );
      const updatedOrder = updatedRows[0];

      // Mise à jour du statut des articles correspondants
      let itemStatus = null;
      if (['preparing', 'shipped_to_store', 'received_at_store', 'picked_up'].includes(newStatus)) {
        itemStatus = newStatus;
      } else if (newStatus === 'ready_for_pickup') {
        itemStatus = 'received_at_store';
      }
      if (itemStatus) {
        await client.query('UPDATE order_items SET status = $1, updated_at = NOW() WHERE order_id = $2', [itemStatus, order.id]);
      }

      // Si ready_for_pickup ou shipped_to_store, s'assurer qu'un code existe
      if (['ready_for_pickup', 'shipped_to_store', 'created'].includes(newStatus)) {
        const { rows: codeRows } = await client.query('SELECT * FROM pickup_codes WHERE order_id = $1', [order.id]);
        if (!codeRows.length) {
          try {
            const { generatePickupCode, getCodeExpiry } = require('../../utils/pickupCode');
            const { buildPickupQRData } = require('../../utils/qrCode');
            const pickupCode = generatePickupCode ? generatePickupCode() : Math.random().toString(36).substring(2, 10).toUpperCase();
            const expiresAt = getCodeExpiry ? getCodeExpiry() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const qrData = buildPickupQRData ? buildPickupQRData(pickupCode, order.id) : JSON.stringify({ code: pickupCode, orderId: order.id });
            await client.query(`
              INSERT INTO pickup_codes (order_id, code, qr_data, status, expires_at)
              VALUES ($1, $2, $3, 'active', $4)
            `, [order.id, pickupCode, qrData, expiresAt]);
          } catch (e) {
            console.warn('[PICKUP] Erreur code de retrait:', e.message);
          }
        }
      } else if (newStatus === 'picked_up') {
        await client.query("UPDATE pickup_codes SET status = 'used', used_at = NOW() WHERE order_id = $1", [order.id]);
      }

      // Notification au client
      try {
        await client.query(`
          INSERT INTO notifications (user_id, type, title, body, metadata)
          VALUES ($1, 'order_status_updated', $2, $3, $4)
        `, [
          order.client_id,
          '📦 Statut de commande mis à jour',
          `Votre commande #${order.id} est désormais : ${newStatus}`,
          JSON.stringify({ orderId: order.id, status: newStatus })
        ]);
      } catch (e) {}

      // Notification SSE temps réel
      try {
        const { sendNotification } = require('../notifications/sse');
        sendNotification(String(order.client_id), {
          type: 'order_status_changed',
          title: '📦 Mise à jour de votre commande',
          message: `Votre commande #${order.id} est désormais : ${newStatus}`,
          orderId: order.id,
          status: newStatus,
        });
      } catch (e) {}

      return updatedOrder;
    });
  }

  async updateItemStatus(orderId, itemId, vendorId, newStatus, isAdmin = false) {
    return await withTransaction(async (client) => {
      let itemQuery = 'SELECT * FROM order_items WHERE id = $1 AND order_id = $2';
      let params = [itemId, orderId];
      if (!isAdmin && vendorId) {
        itemQuery += ' AND vendor_id = $3';
        params.push(vendorId);
      }
      const { rows: items } = await client.query(itemQuery, params);
      if (!items.length) throw new AppError('Order item not found or unauthorized', 404);
      
      await client.query('UPDATE order_items SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, itemId]);
      
      const { rows: allItems } = await client.query('SELECT status FROM order_items WHERE order_id = $1', [orderId]);
      
      let globalStatus = 'preparing';
      const allReceived = allItems.every(i => i.status === 'received_at_store' || i.status === 'ready_for_pickup' || i.status === 'picked_up');
      const allShipped = allItems.every(i => i.status === 'shipped_to_store' || i.status === 'received_at_store' || i.status === 'ready_for_pickup' || i.status === 'picked_up');
      
      if (allReceived) globalStatus = 'received_at_store';
      else if (allShipped) globalStatus = 'shipped_to_store';
      
      await client.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [globalStatus, orderId]);
      
      // Notification SSE temps réel au client
      try {
        const { sendNotification } = require('../notifications/sse');
        const { rows: orderRows } = await client.query('SELECT client_id FROM orders WHERE id = $1', [orderId]);
        if (orderRows.length && orderRows[0].client_id) {
          sendNotification(String(orderRows[0].client_id), {
            type: 'order_status_changed',
            title: '📦 Mise à jour de votre commande !',
            message: `Votre commande #${orderId} est désormais : ${globalStatus}`,
            orderId: orderId,
            status: globalStatus,
          });
        }
      } catch (sseErr) {
        console.warn('[SSE] Notification client échouée :', sseErr.message);
      }

      return { success: true, newStatus: globalStatus };
    });
  }

  async cancelOrder(orderId, clientId) {
    return await withTransaction(async (client) => {
      const { rows: orders } = await client.query('SELECT * FROM orders WHERE id = $1 AND client_id = $2 AND status = $3', [orderId, clientId, 'created']);
      if (!orders.length) throw new AppError('Order cannot be cancelled', 400);
      
      const { rows: items } = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
      
      for (const item of items) {
        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
      
      await client.query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [orderId]);
      await client.query("UPDATE order_items SET status = 'cancelled', updated_at = NOW() WHERE order_id = $1", [orderId]);
      
      return { success: true };
    });
  }

  async getInvoicePDF(orderId, clientId) {
    const order = await this.getOrderById(orderId, { id: clientId, role: 'client' });
    if (typeof generateInvoice === 'function') return await generateInvoice(order);
    return Buffer.from('%PDF-1.4 Mock Invoice Data');
  }

  async getDeliverySlipPDF(orderId, vendorId) {
    const order = await this.getOrderById(orderId, { vendor_id: vendorId, role: 'vendor' });
    if (typeof generateDeliverySlip === 'function') return await generateDeliverySlip(order);
    return Buffer.from('%PDF-1.4 Mock Delivery Slip Data');
  }
}

module.exports = new OrdersService();
