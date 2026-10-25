import express from 'express';
import { db, runInTransaction } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/orders - List orders
// Customer: only what they own. Admin/Studio: all orders.
router.get('/', authenticateToken, (req, res) => {
  let query = `
    SELECT 
      o.id,
      o.customer_id,
      o.painting_id,
      o.price_paid,
      o.status,
      o.created_at,
      o.cancelled_at,
      p.title AS painting_title,
      p.artist AS painting_artist,
      p.image_url AS painting_image_url,
      p.medium AS painting_medium,
      p.dimensions AS painting_dimensions,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN paintings p ON o.painting_id = p.id
    JOIN users u ON o.customer_id = u.id
  `;

  const params = [];

  if (req.user.role === 'customer') {
    query += ' WHERE o.customer_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY o.id DESC';

  const orders = db.prepare(query).all(...params);
  res.json({ orders });
});

// GET /api/orders/:id - Get single order details
// If customer asks for someone else's record -> 404 Not Found
router.get('/:id', authenticateToken, (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID.' });
  }

  const order = db.prepare(`
    SELECT 
      o.id,
      o.customer_id,
      o.painting_id,
      o.price_paid,
      o.status,
      o.created_at,
      o.cancelled_at,
      p.title AS painting_title,
      p.artist AS painting_artist,
      p.image_url AS painting_image_url,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN paintings p ON o.painting_id = p.id
    JOIN users u ON o.customer_id = u.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // Cross-user ownership check: Customer asking for someone else's record gets 404
  if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  res.json({ order });
});

// POST /api/orders - Customer purchases an available painting
// RBAC: Customer only (Admin/Studio: No -> 403)
router.post('/', authenticateToken, requireRole('customer'), (req, res) => {
  const { painting_id } = req.body;

  if (!painting_id) {
    return res.status(400).json({ error: 'A valid painting_id is required.' });
  }

  const paintingId = String(painting_id).trim();

  try {
    const order = runInTransaction(() => {
      // First check if painting exists
      const painting = db.prepare('SELECT * FROM paintings WHERE id = ?').get(paintingId);
      if (!painting) {
        const err = new Error('Painting not found.');
        err.statusCode = 404;
        throw err;
      }

      // Check availability and update atomically to 'sold'
      const updateStmt = db.prepare(`
        UPDATE paintings
        SET status = 'sold', updated_at = datetime('now')
        WHERE id = ? AND status = 'available'
      `);

      const result = updateStmt.run(paintingId);
      if (result.changes === 0) {
        const err = new Error('This painting has just been purchased by another collector.');
        err.statusCode = 409;
        throw err;
      }

      // Record order with verified server-side price (never trusted from client)
      const orderStmt = db.prepare(`
        INSERT INTO orders (customer_id, painting_id, price_paid, status)
        VALUES (?, ?, ?, 'placed')
      `);

      const orderResult = orderStmt.run(req.user.id, paintingId, painting.price);

      return {
        id: Number(orderResult.lastInsertRowid),
        customer_id: req.user.id,
        painting_id: paintingId,
        price_paid: painting.price,
        status: 'placed',
        painting_title: painting.title,
        painting_image_url: painting.image_url
      };
    });

    res.status(201).json({ message: 'Painting purchased successfully!', order });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Failed to complete painting purchase.' });
  }
});

// PUT /api/orders/:id/cancel - Customer cancels their own order
// Painting becomes available again!
// RBAC: Customer only (Customer: Yes (only what they own), Admin: No -> 403)
router.put('/:id/cancel', authenticateToken, requireRole('customer'), (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  if (isNaN(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID.' });
  }

  const existingOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!existingOrder) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // Cross-customer check: asking for someone else's record gets 404
  if (existingOrder.customer_id !== req.user.id) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (existingOrder.status === 'cancelled') {
    return res.status(400).json({ error: 'This order has already been cancelled.' });
  }

  try {
    runInTransaction(() => {
      // 1. Mark order cancelled
      const cancelStmt = db.prepare(`
        UPDATE orders
        SET status = 'cancelled', cancelled_at = datetime('now')
        WHERE id = ? AND status = 'placed'
      `);
      const result = cancelStmt.run(orderId);
      if (result.changes === 0) {
        throw new Error('Order could not be cancelled.');
      }

      // 2. Return painting to available status
      db.prepare(`
        UPDATE paintings
        SET status = 'available', updated_at = datetime('now')
        WHERE id = ?
      `).run(existingOrder.painting_id);
    });

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.json({ message: 'Order cancelled successfully. Painting is now available again.', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to cancel order.' });
  }
});

export default router;
