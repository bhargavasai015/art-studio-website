PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer', 'admin')),
  full_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS paintings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  description TEXT,
  medium TEXT,
  dimensions TEXT,
  price REAL NOT NULL CHECK(price > 0),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'sold')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  painting_id INTEGER NOT NULL REFERENCES paintings(id) ON DELETE CASCADE,
  price_paid REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  cancelled_at TEXT
);

CREATE TABLE IF NOT EXISTS wall_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_date TEXT NOT NULL,
  wall_size REAL NOT NULL CHECK(wall_size >= 10 AND wall_size <= 500),
  rate_per_sqft REAL NOT NULL,
  total_price REAL NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested', 'confirmed', 'declined', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ensure a date can only have at most ONE active (requested or confirmed) booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_wall_bookings_active_date
  ON wall_bookings(booking_date)
  WHERE status IN ('requested', 'confirmed');

CREATE TABLE IF NOT EXISTS pottery_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS pottery_glazes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  hex_code TEXT NOT NULL,
  finish TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pottery_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES pottery_items(id),
  glaze_id INTEGER NOT NULL REFERENCES pottery_glazes(id),
  quantity INTEGER NOT NULL CHECK(quantity >= 1 AND quantity <= 12),
  needed_by TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested', 'accepted', 'declined', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS studio_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
