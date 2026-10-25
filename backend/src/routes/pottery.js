import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to calculate calendar days difference
function getDaysDifference(targetDateStr) {
  const parts = targetDateStr.split('-');
  if (parts.length !== 3) return NaN;

  const target = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// GET /api/pottery/options - Public catalog of items and glazes
router.get('/options', (req, res) => {
  const items = db.prepare('SELECT * FROM pottery_items ORDER BY id ASC').all();
  const glazes = db.prepare('SELECT * FROM pottery_glazes ORDER BY id ASC').all();
  res.json({ items, glazes });
});

// GET /api/pottery - List pottery requests
// Customer: only what they own. Admin/Studio: all requests.
router.get('/', authenticateToken, (req, res) => {
  let query = `
    SELECT 
      pr.id,
      pr.customer_id,
      pr.item_id,
      pr.glaze_id,
      pr.quantity,
      pr.needed_by,
      pr.notes,
      pr.status,
      pr.created_at,
      pr.updated_at,
      pi.name AS item_name,
      pi.description AS item_description,
      pi.base_price AS item_base_price,
      pg.name AS glaze_name,
      pg.hex_code AS glaze_hex_code,
      pg.finish AS glaze_finish,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM pottery_requests pr
    JOIN pottery_items pi ON pr.item_id = pi.id
    JOIN pottery_glazes pg ON pr.glaze_id = pg.id
    JOIN users u ON pr.customer_id = u.id
  `;

  const params = [];

  if (req.user.role === 'customer') {
    query += ' WHERE pr.customer_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY pr.id DESC';

  const requests = db.prepare(query).all(...params);
  res.json({ requests });
});

// GET /api/pottery/:id - Single pottery request
// Customer asking for someone else's record gets 404
router.get('/:id', authenticateToken, (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) {
    return res.status(400).json({ error: 'Invalid pottery request ID.' });
  }

  const request = db.prepare(`
    SELECT 
      pr.id,
      pr.customer_id,
      pr.item_id,
      pr.glaze_id,
      pr.quantity,
      pr.needed_by,
      pr.notes,
      pr.status,
      pr.created_at,
      pr.updated_at,
      pi.name AS item_name,
      pi.description AS item_description,
      pi.base_price AS item_base_price,
      pg.name AS glaze_name,
      pg.hex_code AS glaze_hex_code,
      pg.finish AS glaze_finish,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM pottery_requests pr
    JOIN pottery_items pi ON pr.item_id = pi.id
    JOIN pottery_glazes pg ON pr.glaze_id = pg.id
    JOIN users u ON pr.customer_id = u.id
    WHERE pr.id = ?
  `).get(requestId);

  if (!request) {
    return res.status(404).json({ error: 'Pottery request not found.' });
  }

  // Cross-user ownership check: Customer asking for someone else's record gets 404
  if (req.user.role === 'customer' && request.customer_id !== req.user.id) {
    return res.status(404).json({ error: 'Pottery request not found.' });
  }

  res.json({ request });
});

// POST /api/pottery - Customer requests custom pottery
// RBAC: Customer only (Admin: No -> 403)
router.post('/', authenticateToken, requireRole('customer'), (req, res) => {
  const { item_id, glaze_id, quantity, needed_by, notes } = req.body;

  if (!item_id || !glaze_id || quantity === undefined || !needed_by) {
    return res.status(400).json({ error: 'item_id, glaze_id, quantity, and needed_by date are required.' });
  }

  const itemId = String(item_id).trim();
  const glazeId = String(glaze_id).trim();

  // 1. Verify item exists
  const item = db.prepare('SELECT id FROM pottery_items WHERE id = ?').get(itemId);
  if (!item) {
    return res.status(400).json({ error: 'Selected pottery item is invalid or not in catalog.' });
  }

  // 2. Verify glaze exists
  const glaze = db.prepare('SELECT id FROM pottery_glazes WHERE id = ?').get(glazeId);
  if (!glaze) {
    return res.status(400).json({ error: 'Selected pottery glaze is invalid or not in catalog.' });
  }

  // 3. Validate quantity: 1 to 12
  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty < 1 || parsedQty > 12) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 12 items.' });
  }

  // 4. Validate needed-by date: at least 14 days away
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(needed_by)) {
    return res.status(400).json({ error: 'Needed-by date must be in YYYY-MM-DD format.' });
  }

  const diffDays = getDaysDifference(needed_by);
  if (isNaN(diffDays) || diffDays < 14) {
    return res.status(400).json({
      error: `Needed-by date must be at least 14 days away to allow clay curing and firing. (Provided date is ${diffDays} day(s) away).`
    });
  }

  const insertStmt = db.prepare(`
    INSERT INTO pottery_requests (customer_id, item_id, glaze_id, quantity, needed_by, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, 'requested')
  `);

  const result = insertStmt.run(
    req.user.id,
    itemId,
    glazeId,
    parsedQty,
    needed_by,
    notes ? notes.trim() : null
  );

  const newRequest = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Custom pottery request submitted successfully!', request: newRequest });
});

// PUT /api/pottery/:id - Customer edits a request
// Specification: A customer can edit or cancel a request only while it is still requested.
router.put('/:id', authenticateToken, requireRole('customer'), (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) {
    return res.status(400).json({ error: 'Invalid pottery request ID.' });
  }

  const request = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(requestId);
  if (!request) {
    return res.status(404).json({ error: 'Pottery request not found.' });
  }

  // Cross-user ownership check
  if (request.customer_id !== req.user.id) {
    return res.status(404).json({ error: 'Pottery request not found.' });
  }

  // Rule: A customer can edit only while it is still requested
  if (request.status !== 'requested') {
    return res.status(400).json({
      error: `Cannot edit request in '${request.status}' status. Only requests with status 'requested' can be modified.`
    });
  }

  const { item_id, glaze_id, quantity, needed_by, notes } = req.body;

  let targetItemId = request.item_id;
  if (item_id !== undefined) {
    const itemId = String(item_id).trim();
    const item = db.prepare('SELECT id FROM pottery_items WHERE id = ?').get(itemId);
    if (!item) return res.status(400).json({ error: 'Selected pottery item is invalid.' });
    targetItemId = itemId;
  }

  let targetGlazeId = request.glaze_id;
  if (glaze_id !== undefined) {
    const glazeId = String(glaze_id).trim();
    const glaze = db.prepare('SELECT id FROM pottery_glazes WHERE id = ?').get(glazeId);
    if (!glaze) return res.status(400).json({ error: 'Selected pottery glaze is invalid.' });
    targetGlazeId = glazeId;
  }

  let targetQuantity = request.quantity;
  if (quantity !== undefined) {
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1 || parsedQty > 12) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 12 items.' });
    }
    targetQuantity = parsedQty;
  }

  let targetNeededBy = request.needed_by;
  if (needed_by !== undefined) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(needed_by)) {
      return res.status(400).json({ error: 'Needed-by date must be in YYYY-MM-DD format.' });
    }
    const diffDays = getDaysDifference(needed_by);
    if (isNaN(diffDays) || diffDays < 14) {
      return res.status(400).json({
        error: `Needed-by date must be at least 14 days away. (Provided date is ${diffDays} day(s) away).`
      });
    }
    targetNeededBy = needed_by;
  }

  const targetNotes = notes !== undefined ? (notes ? notes.trim() : null) : request.notes;

  const updateStmt = db.prepare(`
    UPDATE pottery_requests
    SET item_id = ?, glaze_id = ?, quantity = ?, needed_by = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ? AND status = 'requested'
  `);

  const result = updateStmt.run(targetItemId, targetGlazeId, targetQuantity, targetNeededBy, targetNotes, requestId);
  if (result.changes === 0) {
    return res.status(400).json({ error: 'Could not update request. Status may have changed.' });
  }

  const updatedRequest = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(requestId);
  res.json({ message: 'Pottery request updated successfully.', request: updatedRequest });
});

// PUT /api/pottery/:id/cancel - Customer cancels request
// Specification: A customer can edit or cancel a request only while it is still requested.
router.put('/:id/cancel', authenticateToken, requireRole('customer'), (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) {
    return res.status(400).json({ error: 'Invalid pottery request ID.' });
  }

  const request = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(requestId);
  if (!request) {
    return res.status(404).json({ error: 'Pottery request not found.' });
  }

  // Cross-user ownership check
  if (request.customer_id !== req.user.id) {
    return res.status(404).json({ error: 'Pottery request not found.' });
  }

  // Rule: can cancel only while it is still requested
  if (request.status !== 'requested') {
    return res.status(400).json({
      error: `Cannot cancel request in '${request.status}' status. Only requests with status 'requested' can be cancelled.`
    });
  }

  db.prepare(`
    UPDATE pottery_requests
    SET status = 'cancelled', updated_at = datetime('now')
    WHERE id = ? AND status = 'requested'
  `).run(requestId);

  const updatedRequest = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(requestId);
  res.json({ message: 'Pottery request cancelled successfully.', request: updatedRequest });
});

// PUT /api/pottery/:id/accept - Studio accepts request (Admin/Studio only)
router.put('/:id/accept', authenticateToken, requireRole('admin'), (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) {
    return res.status(400).json({ error: 'Invalid pottery request ID.' });
  }

  const request = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(requestId);
  if (!request) {
    return res.status(404).json({ error: 'Pottery request not found.' });
  }

  if (request.status !== 'requested') {
    return res.status(400).json({ error: `Cannot accept request in '${request.status}' status.` });
  }

  db.prepare(`
    UPDATE pottery_requests
    SET status = 'accepted', updated_at = datetime('now')
    WHERE id = ?
  `).run(requestId);

  const updatedRequest = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(requestId);
  res.json({ message: 'Pottery request accepted.', request: updatedRequest });
});

// PUT /api/pottery/:id/decline - Studio declines request (Admin/Studio only)
router.put('/:id/decline', authenticateToken, requireRole('admin'), (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) {
    return res.status(400).json({ error: 'Invalid pottery request ID.' });
  }

  const request = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(requestId);
  if (!request) {
    return res.status(404).json({ error: 'Pottery request not found.' });
  }

  if (request.status !== 'requested') {
    return res.status(400).json({ error: `Cannot decline request in '${request.status}' status.` });
  }

  db.prepare(`
    UPDATE pottery_requests
    SET status = 'declined', updated_at = datetime('now')
    WHERE id = ?
  `).run(requestId);

  const updatedRequest = db.prepare('SELECT * FROM pottery_requests WHERE id = ?').get(requestId);
  res.json({ message: 'Pottery request declined.', request: updatedRequest });
});

export default router;
