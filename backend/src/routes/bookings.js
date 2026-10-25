import express from 'express';
import { db, runInTransaction } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { WALL_PAINTING_RATE_PER_SQFT } from '../config.js';

const router = express.Router();

// Helper to get active studio wall painting rate
function getWallRate() {
  const setting = db.prepare('SELECT value FROM studio_settings WHERE key = ?').get('wall_rate_per_sqft');
  return setting ? parseFloat(setting.value) : WALL_PAINTING_RATE_PER_SQFT;
}

// Helper to calculate difference in calendar days between today and target date
function getDaysDifference(targetDateStr) {
  const parts = targetDateStr.split('-');
  if (parts.length !== 3) return NaN;

  const target = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// GET /api/bookings/booked-dates - Public list of dates already booked (status in requested, confirmed)
router.get('/booked-dates', (req, res) => {
  const rows = db.prepare(`
    SELECT booking_date 
    FROM wall_bookings 
    WHERE status IN ('requested', 'confirmed')
    ORDER BY booking_date ASC
  `).all();

  const bookedDates = rows.map(r => r.booking_date);
  res.json({ bookedDates, rate_per_sqft: getWallRate() });
});

// GET /api/bookings - List bookings
// Customer: only what they own. Admin: all bookings.
router.get('/', authenticateToken, (req, res) => {
  let query = `
    SELECT 
      b.id,
      b.customer_id,
      b.booking_date,
      b.wall_size,
      b.rate_per_sqft,
      b.total_price,
      b.address,
      b.status,
      b.created_at,
      b.updated_at,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM wall_bookings b
    JOIN users u ON b.customer_id = u.id
  `;

  const params = [];

  if (req.user.role === 'customer') {
    query += ' WHERE b.customer_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY b.booking_date ASC, b.id DESC';

  const bookings = db.prepare(query).all(...params);
  res.json({ bookings });
});

// GET /api/bookings/:id - Single booking
// Customer asking for someone else's record gets 404
router.get('/:id', authenticateToken, (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  if (isNaN(bookingId)) {
    return res.status(400).json({ error: 'Invalid booking ID.' });
  }

  const booking = db.prepare(`
    SELECT 
      b.id,
      b.customer_id,
      b.booking_date,
      b.wall_size,
      b.rate_per_sqft,
      b.total_price,
      b.address,
      b.status,
      b.created_at,
      b.updated_at,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM wall_bookings b
    JOIN users u ON b.customer_id = u.id
    WHERE b.id = ?
  `).get(bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Cross-user ownership check: Customer asking for someone else's record gets 404
  if (req.user.role === 'customer' && booking.customer_id !== req.user.id) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  res.json({ booking });
});

// POST /api/bookings - Customer books a wall painting
// RBAC: Customer only (Admin: No -> 403)
router.post('/', authenticateToken, requireRole('customer'), (req, res) => {
  const { booking_date, wall_size, address } = req.body;

  if (!booking_date || wall_size === undefined || wall_size === null || !address) {
    return res.status(400).json({ error: 'booking_date, wall_size, and address are required.' });
  }

  // 1. Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(booking_date)) {
    return res.status(400).json({ error: 'Booking date must be in YYYY-MM-DD format.' });
  }

  // 2. Validate date range: from 7 to 90 days away
  const diffDays = getDaysDifference(booking_date);
  if (isNaN(diffDays)) {
    return res.status(400).json({ error: 'Invalid date specified.' });
  }

  if (diffDays < 7 || diffDays > 90) {
    return res.status(400).json({
      error: `Booking date must be between 7 and 90 days in the future. (Selected date is ${diffDays} day(s) away).`
    });
  }

  // 3. Validate wall size: 10 to 500 sq ft
  const parsedSize = parseFloat(wall_size);
  if (isNaN(parsedSize) || parsedSize < 10 || parsedSize > 500) {
    return res.status(400).json({ error: 'Wall size must be between 10 and 500 sq ft.' });
  }

  // 4. Validate address
  const cleanAddress = address.trim();
  if (cleanAddress.length < 5) {
    return res.status(400).json({ error: 'Please provide a complete service address.' });
  }

  // 5. Server-side price calculation using rate from seed data
  const rate = getWallRate();
  const totalPrice = Math.round(parsedSize * rate * 100) / 100;

  try {
    const booking = runInTransaction(() => {
      // Check if date is already booked
      const existing = db.prepare(`
        SELECT id FROM wall_bookings 
        WHERE booking_date = ? AND status IN ('requested', 'confirmed')
      `).get(booking_date);

      if (existing) {
        const err = new Error('This date has already been booked. Please choose another date.');
        err.statusCode = 409;
        throw err;
      }

      const insertStmt = db.prepare(`
        INSERT INTO wall_bookings (customer_id, booking_date, wall_size, rate_per_sqft, total_price, address, status)
        VALUES (?, ?, ?, ?, ?, ?, 'requested')
      `);

      const result = insertStmt.run(
        req.user.id,
        booking_date,
        parsedSize,
        rate,
        totalPrice,
        cleanAddress
      );

      return {
        id: Number(result.lastInsertRowid),
        customer_id: req.user.id,
        booking_date,
        wall_size: parsedSize,
        rate_per_sqft: rate,
        total_price: totalPrice,
        address: cleanAddress,
        status: 'requested'
      };
    });

    res.status(201).json({ message: 'Wall painting booking requested successfully!', booking });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This date has already been booked by another customer.' });
    }
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Failed to submit wall booking request.' });
  }
});

// PUT /api/bookings/:id/confirm - Studio confirms booking (Admin only)
router.put('/:id/confirm', authenticateToken, requireRole('admin'), (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  if (isNaN(bookingId)) {
    return res.status(400).json({ error: 'Invalid booking ID.' });
  }

  const booking = db.prepare('SELECT * FROM wall_bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (booking.status !== 'requested') {
    return res.status(400).json({ error: `Cannot confirm booking in '${booking.status}' status.` });
  }

  db.prepare(`
    UPDATE wall_bookings
    SET status = 'confirmed', updated_at = datetime('now')
    WHERE id = ?
  `).run(bookingId);

  const updatedBooking = db.prepare('SELECT * FROM wall_bookings WHERE id = ?').get(bookingId);
  res.json({ message: 'Booking confirmed successfully.', booking: updatedBooking });
});

// PUT /api/bookings/:id/decline - Studio declines booking (Admin only)
router.put('/:id/decline', authenticateToken, requireRole('admin'), (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  if (isNaN(bookingId)) {
    return res.status(400).json({ error: 'Invalid booking ID.' });
  }

  const booking = db.prepare('SELECT * FROM wall_bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (booking.status !== 'requested') {
    return res.status(400).json({ error: `Cannot decline booking in '${booking.status}' status.` });
  }

  db.prepare(`
    UPDATE wall_bookings
    SET status = 'declined', updated_at = datetime('now')
    WHERE id = ?
  `).run(bookingId);

  const updatedBooking = db.prepare('SELECT * FROM wall_bookings WHERE id = ?').get(bookingId);
  res.json({ message: 'Booking declined.', booking: updatedBooking });
});

// PUT /api/bookings/:id/cancel - Customer cancels booking
// Rule: A customer can cancel until 3 days before the date.
// RBAC: Customer only (Customer: Yes (only what they own), Admin: No -> 403)
router.put('/:id/cancel', authenticateToken, requireRole('customer'), (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  if (isNaN(bookingId)) {
    return res.status(400).json({ error: 'Invalid booking ID.' });
  }

  const booking = db.prepare('SELECT * FROM wall_bookings WHERE id = ?').get(bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Cross-customer ownership check: customer asking for someone else's record gets 404
  if (booking.customer_id !== req.user.id) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({ error: 'Booking is already cancelled.' });
  }

  if (booking.status === 'declined') {
    return res.status(400).json({ error: 'Cannot cancel a booking that was already declined.' });
  }

  // Business Rule: A customer can cancel until 3 days before the date
  const diffDays = getDaysDifference(booking.booking_date);
  if (diffDays < 3) {
    return res.status(400).json({
      error: `Cancellation deadline passed. Bookings can only be cancelled at least 3 days before the scheduled date (event is in ${diffDays} day(s)).`
    });
  }

  db.prepare(`
    UPDATE wall_bookings
    SET status = 'cancelled', updated_at = datetime('now')
    WHERE id = ?
  `).run(bookingId);

  const updatedBooking = db.prepare('SELECT * FROM wall_bookings WHERE id = ?').get(bookingId);
  res.json({ message: 'Booking cancelled successfully.', booking: updatedBooking });
});

export default router;
