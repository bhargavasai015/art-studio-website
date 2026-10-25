import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { db, runInTransaction } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function seedDatabase(reset = false) {
  const seedJsonPath = path.resolve(__dirname, 'seed.json');
  const seedData = JSON.parse(fs.readFileSync(seedJsonPath, 'utf8'));

  runInTransaction(() => {
    if (reset) {
      db.exec(`
        DELETE FROM orders;
        DELETE FROM wall_bookings;
        DELETE FROM pottery_requests;
        DELETE FROM paintings;
        DELETE FROM pottery_glazes;
        DELETE FROM pottery_items;
        DELETE FROM users;
        DELETE FROM studio_settings;
      `);
    }

    // 1. Studio Settings
    const setSetting = db.prepare(`
      INSERT OR REPLACE INTO studio_settings (key, value)
      VALUES (?, ?)
    `);
    const rate = seedData.mural?.ratePerSqFt || 150;
    setSetting.run('wall_rate_per_sqft', rate.toString());
    setSetting.run('currency', seedData.currency || 'INR');
    setSetting.run('currency_symbol', '₹');
    setSetting.run('studio_name', 'GDGC Artisans Art Studio');

    // 2. Users (Studio Lead & Customers)
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, email, password_hash, role, full_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Studio Account from seed.json ("studio@artstudio.in" / "Studio@123")
    const studioAccount = seedData.studioAccount || {
      email: 'studio@artstudio.in',
      password: 'Studio@123',
      role: 'studio'
    };
    const studioHash = bcrypt.hashSync(studioAccount.password, 10);
    insertUser.run(1, studioAccount.email.toLowerCase(), studioHash, studioAccount.role, 'Studio Lead Master');

    // Admin Alias Account ("admin@artstudio.com" / "AdminPassword123!")
    const adminHash = bcrypt.hashSync('AdminPassword123!', 10);
    insertUser.run(2, 'admin@artstudio.com', adminHash, 'admin', 'Elena Rostova (Studio Admin)');

    // Customer Accounts
    const customer1Hash = bcrypt.hashSync('CustomerPassword123!', 10);
    const customer2Hash = bcrypt.hashSync('BobPassword123!', 10);
    insertUser.run(3, 'customer@example.com', customer1Hash, 'customer', 'Aria Montgomery');
    insertUser.run(4, 'bob@example.com', customer2Hash, 'customer', 'Bob Jenkins');

    // 3. Pottery Items (from seed.json)
    const itemPrices = {
      'i-01': 150.0, // Kulhad
      'i-02': 650.0, // Surahi
      'i-03': 550.0, // Matka
      'i-04': 350.0, // Diya set
      'i-05': 450.0  // Gamla
    };

    const insertItem = db.prepare(`
      INSERT OR REPLACE INTO pottery_items (id, name, description, base_price)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of seedData.potteryItems) {
      const price = itemPrices[item.id] || 250.0;
      insertItem.run(item.id, item.name, `Authentic terracotta ${item.name.toLowerCase()} wheel-thrown and kiln-fired.`, price);
    }

    // 4. Glazes (from seed.json)
    const glazePalette = {
      'g-01': { hex: '#B91C1C', finish: 'Glossy Traditional' }, // Kumkum Red
      'g-02': { hex: '#EAB308', finish: 'Warm Satin' },          // Haldi Yellow
      'g-03': { hex: '#15803D', finish: 'Speckled Earth' },      // Mehendi Green
      'g-04': { hex: '#1E40AF', finish: 'Celestial Deep Blue' }, // Indigo Blue
      'g-05': { hex: '#D4A373', finish: 'Matte Earth' },         // Sandalwood Beige
      'g-06': { hex: '#27272A', finish: 'Smoked Metallic' }       // Charcoal Black
    };

    const insertGlaze = db.prepare(`
      INSERT OR REPLACE INTO pottery_glazes (id, name, hex_code, finish)
      VALUES (?, ?, ?, ?)
    `);

    for (const glaze of seedData.glazes) {
      const info = glazePalette[glaze.id] || { hex: '#78716C', finish: 'Standard Glaze' };
      insertGlaze.run(glaze.id, glaze.name, info.hex, info.finish);
    }

    // 5. Paintings (from seed.json)
    const insertPainting = db.prepare(`
      INSERT OR REPLACE INTO paintings (id, title, artist, description, medium, dimensions, price, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of seedData.paintings) {
      let img = p.imageUrl || '';
      if (!img.startsWith('/') && !img.startsWith('http')) {
        img = '/' + img;
      }

      insertPainting.run(
        p.id,
        p.title,
        p.artist,
        p.description,
        'Traditional Pigments on Natural Substrate',
        'Traditional Dimensions',
        p.price,
        img,
        p.status || 'available'
      );
    }

    // Initial order for sold painting 'p-004' (Pattachitra Dashavatara Panel - ₹12,000)
    const insertOrder = db.prepare(`
      INSERT OR REPLACE INTO orders (id, customer_id, painting_id, price_paid, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertOrder.run(1, 3, 'p-004', 12000.0, 'placed');

    // 6. Wall Bookings (1 sample for customer Aria)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const bookingDateStr = futureDate.toISOString().split('T')[0];

    const insertBooking = db.prepare(`
      INSERT OR REPLACE INTO wall_bookings (id, customer_id, booking_date, wall_size, rate_per_sqft, total_price, address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const sampleSize = 100;
    insertBooking.run(
      1,
      3,
      bookingDateStr,
      sampleSize,
      rate,
      sampleSize * rate, // 100 sq ft * ₹150 = ₹15,000
      'Flat 402, Lotus Heritage, Hyderabad, Telangana',
      'requested'
    );

    // 7. Pottery Requests (1 sample for customer Aria)
    const neededDate = new Date();
    neededDate.setDate(neededDate.getDate() + 25);
    const neededDateStr = neededDate.toISOString().split('T')[0];

    const insertPottery = db.prepare(`
      INSERT OR REPLACE INTO pottery_requests (id, customer_id, item_id, glaze_id, quantity, needed_by, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPottery.run(
      1,
      3,
      'i-01', // Kulhad
      'g-01', // Kumkum Red
      4,
      neededDateStr,
      'Handcrafted tea set for festival celebration with smooth drinking lip.',
      'requested'
    );
  });

  console.log('Database seeded successfully from seed.json with INR currency.');
}

// If run directly from terminal
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase(process.argv.includes('--reset'));
}
