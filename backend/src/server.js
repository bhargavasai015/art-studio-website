import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PORT } from './config.js';
import authRoutes from './routes/auth.js';
import paintingsRoutes from './routes/paintings.js';
import ordersRoutes from './routes/orders.js';
import bookingsRoutes from './routes/bookings.js';
import potteryRoutes from './routes/pottery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve static images directory
const imagesDir = path.resolve(__dirname, '../public/images');
if (fs.existsSync(imagesDir)) {
  app.use('/images', express.static(imagesDir));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/paintings', paintingsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/pottery', potteryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', currency: 'INR', timestamp: new Date().toISOString() });
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Serve frontend production build if available
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/images')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start listener only when run directly (not during tests)
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  app.listen(PORT, () => {
    console.log(`Art Studio Application running on http://localhost:${PORT}`);
  });
}
