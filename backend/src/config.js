import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT || 5001;
export const JWT_SECRET = process.env.JWT_SECRET || 'gdgc-art-studio-super-secret-jwt-key-2026';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../data/art_studio.db');
export const WALL_PAINTING_RATE_PER_SQFT = parseFloat(process.env.WALL_PAINTING_RATE_PER_SQFT || '150.00');
export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';
