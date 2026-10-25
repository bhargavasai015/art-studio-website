import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { db } from '../db/database.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userStmt = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?');
    const user = userStmt.get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User session invalid. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userRole = req.user.role;
    // 'studio' and 'admin' are synonyms for the studio administration role
    const hasRole = allowedRoles.includes(userRole) ||
      (allowedRoles.includes('admin') && userRole === 'studio') ||
      (allowedRoles.includes('studio') && userRole === 'admin');

    if (!hasRole) {
      return res.status(403).json({ error: 'Access forbidden: Insufficient permissions for this action.' });
    }
    next();
  };
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userStmt = db.prepare('SELECT id, email, role, full_name FROM users WHERE id = ?');
    const user = userStmt.get(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}
