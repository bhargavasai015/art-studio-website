import bcrypt from 'bcryptjs';
import { db, runInTransaction } from './database.js';
import { WALL_PAINTING_RATE_PER_SQFT } from '../config.js';

export function seedDatabase(reset = false) {
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
    setSetting.run('wall_rate_per_sqft', WALL_PAINTING_RATE_PER_SQFT.toString());
    setSetting.run('studio_name', 'GDGC Artisans Studio');
    setSetting.run('studio_phone', '+1 (555) 019-2834');
    setSetting.run('studio_email', 'contact@artstudio.com');

    // 2. Users (Admin and Customers)
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, role, full_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    const adminHash = bcrypt.hashSync('AdminPassword123!', 10);
    const customer1Hash = bcrypt.hashSync('CustomerPassword123!', 10);
    const customer2Hash = bcrypt.hashSync('BobPassword123!', 10);

    insertUser.run(1, 'admin@artstudio.com', adminHash, 'admin', 'Elena Rostova (Studio Lead)');
    insertUser.run(2, 'customer@example.com', customer1Hash, 'customer', 'Aria Montgomery');
    insertUser.run(3, 'bob@example.com', customer2Hash, 'customer', 'Bob Jenkins');

    // 3. Pottery Items
    const insertItem = db.prepare(`
      INSERT OR IGNORE INTO pottery_items (id, name, description, base_price)
      VALUES (?, ?, ?, ?)
    `);
    insertItem.run(1, 'Fluted Vase', 'Hand-thrown fluted ceramic vase, 11 inches tall, ideal for floral arrangements.', 48.00);
    insertItem.run(2, 'Artisan Mug', 'Ergonomic stoneware coffee mug, 350ml capacity with handcrafted thumb rest.', 26.00);
    insertItem.run(3, 'Serving Bowl', 'Wide stoneware bowl for salads and family dinners, 10 inches diameter.', 58.00);
    insertItem.run(4, 'Botanical Planter', 'Minimalist indoor plant pot with integrated drainage dish, 7 inches diameter.', 38.00);
    insertItem.run(5, 'Dinner Plate', 'Stoneware dinner plate with an organic raised lip, 10.5 inches diameter.', 32.00);
    insertItem.run(6, 'Kyusu Teapot', 'Japanese style tea brewing vessel featuring a hand-pierced internal clay strainer.', 74.00);

    // 4. Pottery Glazes
    const insertGlaze = db.prepare(`
      INSERT OR IGNORE INTO pottery_glazes (id, name, hex_code, finish)
      VALUES (?, ?, ?, ?)
    `);
    insertGlaze.run(1, 'Cobalt Indigo', '#1E3A8A', 'Glossy');
    insertGlaze.run(2, 'Forest Moss', '#3F6212', 'Satin Speckled');
    insertGlaze.run(3, 'Desert Terracotta', '#B45309', 'Textured Matte');
    insertGlaze.run(4, 'Seafoam Celadon', '#0D9488', 'Crackle Glaze');
    insertGlaze.run(5, 'Midnight Obsidian', '#18181B', 'Matte Metallic');
    insertGlaze.run(6, 'Pure Alabaster', '#F4F4F5', 'Soft Satin');

    // 5. Paintings
    const insertPainting = db.prepare(`
      INSERT OR IGNORE INTO paintings (id, title, artist, description, medium, dimensions, price, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPainting.run(
      1,
      'Echoes of the Mediterranean',
      'Elena Rostova',
      'Vibrant cobalt and terracotta palette capturing the golden afternoon sun reflecting on Aegean seaside cliffs.',
      'Oil on Canvas',
      '36" x 48"',
      650.00,
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      'available'
    );

    insertPainting.run(
      2,
      'Solitude in Amber',
      'Marcus Vance',
      'An intimate study of warm shadows and amber hues reminiscent of autumn evenings in an old library.',
      'Acrylic on Wood Panel',
      '24" x 30"',
      420.00,
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      'available'
    );

    insertPainting.run(
      3,
      'Whispers of the Monsoon',
      'Priya Sharma',
      'Fluid watercolor transitions evoking misty tropical rains dancing across lush emerald foliage.',
      'Watercolor & Ink on Arches Paper',
      '18" x 24"',
      290.00,
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
      'available'
    );

    insertPainting.run(
      4,
      'Terra Incognita',
      'Elena Rostova',
      'Textured abstract cartography created with raw natural pigments, pumice stone paste, and genuine 24k gold leaf.',
      'Mixed Media with Gold Leaf on Linen',
      '40" x 40"',
      890.00,
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
      'available'
    );

    insertPainting.run(
      5,
      'Morning Mist over Valleys',
      'Marcus Vance',
      'Atmospheric impressionist landscape showcasing quiet alpine dawn with layered pine silhouettes.',
      'Oil on Linen',
      '30" x 40"',
      540.00,
      'https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&w=800&q=80',
      'available'
    );

    insertPainting.run(
      6,
      'Symphony of the Dunes',
      'Elena Rostova',
      'Minimalist wave contours sculpted with textured sand and acrylic wash, evoking desert winds at dusk.',
      'Textured Acrylic & Desert Sand',
      '24" x 36"',
      380.00,
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      'available'
    );

    insertPainting.run(
      7,
      'Canyon Reverie',
      'Priya Sharma',
      'Dramatic geological strata highlighted through burnt sienna, deep charcoal, and ochre pigment washes.',
      'Acrylic and Charcoal on Canvas',
      '32" x 44"',
      580.00,
      'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&w=800&q=80',
      'available'
    );

    insertPainting.run(
      8,
      'Twilight at the Venetian Canal',
      'Marcus Vance',
      'Romantic Venetian bridge bathed in lantern reflections and twilight lavender mist.',
      'Oil on Canvas',
      '20" x 28"',
      460.00,
      'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?auto=format&fit=crop&w=800&q=80',
      'sold' // Initially sold to demo order cancellation and sold state
    );

    // Initial placed order for painting #8 by customer #2 (Jane Doe)
    const insertOrder = db.prepare(`
      INSERT OR IGNORE INTO orders (id, customer_id, painting_id, price_paid, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertOrder.run(1, 2, 8, 460.00, 'placed');

    // 6. Wall Bookings (1 sample for customer 2)
    // Booking 20 days in future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const bookingDateStr = futureDate.toISOString().split('T')[0];

    const insertBooking = db.prepare(`
      INSERT OR IGNORE INTO wall_bookings (id, customer_id, booking_date, wall_size, rate_per_sqft, total_price, address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertBooking.run(
      1,
      2,
      bookingDateStr,
      120,
      WALL_PAINTING_RATE_PER_SQFT,
      120 * WALL_PAINTING_RATE_PER_SQFT,
      '742 Evergreen Terrace, Springfield',
      'requested'
    );

    // 7. Pottery Requests (1 sample for customer 2)
    // Needed 25 days in future
    const neededDate = new Date();
    neededDate.setDate(neededDate.getDate() + 25);
    const neededDateStr = neededDate.toISOString().split('T')[0];

    const insertPottery = db.prepare(`
      INSERT OR IGNORE INTO pottery_requests (id, customer_id, item_id, glaze_id, quantity, needed_by, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPottery.run(
      1,
      2,
      1, // Fluted Vase
      1, // Cobalt Indigo
      2,
      neededDateStr,
      'Please ensure the glaze has a smooth finish near the lip.',
      'requested'
    );
  });

  console.log('Database seeded successfully.');
}

// If run directly from terminal
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase(process.argv.includes('--reset'));
}
