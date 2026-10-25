import express from 'express';
import { db } from '../db/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/paintings - Browse all paintings (with optional status filter)
router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM paintings';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY id ASC';

  const paintings = db.prepare(query).all(...params);
  res.json({ paintings });
});

// GET /api/paintings/:id - Get a single painting
router.get('/:id', (req, res) => {
  const paintingId = req.params.id;
  if (!paintingId) {
    return res.status(400).json({ error: 'Invalid painting ID.' });
  }

  const painting = db.prepare('SELECT * FROM paintings WHERE id = ?').get(paintingId);
  if (!painting) {
    return res.status(404).json({ error: 'Painting not found.' });
  }

  res.json({ painting });
});

// POST /api/paintings - Studio adds a new painting (Admin/Studio only)
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  const { id, title, artist, description, medium, dimensions, price, image_url } = req.body;

  if (!title || !artist || price === undefined || price === null) {
    return res.status(400).json({ error: 'Title, artist, and price are required.' });
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number.' });
  }

  const paintingId = id ? id.trim() : `p-${Date.now().toString().slice(-4)}`;

  const insertStmt = db.prepare(`
    INSERT INTO paintings (id, title, artist, description, medium, dimensions, price, image_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')
  `);

  insertStmt.run(
    paintingId,
    title.trim(),
    artist.trim(),
    description ? description.trim() : null,
    medium ? medium.trim() : 'Traditional Pigments on Canvas',
    dimensions ? dimensions.trim() : '45 x 60 cm',
    parsedPrice,
    image_url ? image_url.trim() : '/images/p-001.jpg'
  );

  const newPainting = db.prepare('SELECT * FROM paintings WHERE id = ?').get(paintingId);
  res.status(201).json({ message: 'Painting added successfully.', painting: newPainting });
});

// PUT /api/paintings/:id - Studio edits a painting (Admin/Studio only, ONLY while available)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const paintingId = req.params.id;
  if (!paintingId) {
    return res.status(400).json({ error: 'Invalid painting ID.' });
  }

  const painting = db.prepare('SELECT * FROM paintings WHERE id = ?').get(paintingId);
  if (!painting) {
    return res.status(404).json({ error: 'Painting not found.' });
  }

  // Business specification: Add or edit a painting (only while available)
  if (painting.status !== 'available') {
    return res.status(400).json({ error: 'Cannot edit a sold painting.' });
  }

  const { title, artist, description, medium, dimensions, price, image_url } = req.body;

  let parsedPrice = painting.price;
  if (price !== undefined && price !== null) {
    parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }
  }

  const updateStmt = db.prepare(`
    UPDATE paintings
    SET title = ?, artist = ?, description = ?, medium = ?, dimensions = ?, price = ?, image_url = ?, updated_at = datetime('now')
    WHERE id = ? AND status = 'available'
  `);

  const result = updateStmt.run(
    title !== undefined ? title.trim() : painting.title,
    artist !== undefined ? artist.trim() : painting.artist,
    description !== undefined ? description.trim() : painting.description,
    medium !== undefined ? medium.trim() : painting.medium,
    dimensions !== undefined ? dimensions.trim() : painting.dimensions,
    parsedPrice,
    image_url !== undefined ? image_url.trim() : painting.image_url,
    paintingId
  );

  if (result.changes === 0) {
    return res.status(400).json({ error: 'Could not update painting. It may have just been sold.' });
  }

  const updatedPainting = db.prepare('SELECT * FROM paintings WHERE id = ?').get(paintingId);
  res.json({ message: 'Painting updated successfully.', painting: updatedPainting });
});

export default router;
