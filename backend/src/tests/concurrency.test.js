import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { request, getAuthTokens } from './testHelper.js';
import { db } from '../db/database.js';

describe('Concurrency & Race Condition Safety Tests', () => {
  let tokens;

  before(async () => {
    tokens = await getAuthTokens();
  });

  function getOffsetDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  test('Concurrent Painting Purchase: exactly one succeeds (201) and one fails (409)', async () => {
    // Painting #4 ("Terra Incognita", $890.00) is available
    const paintingId = 4;

    // Both customer 1 and customer 2 fire purchase requests simultaneously
    const p1 = request
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({ painting_id: paintingId });

    const p2 = request
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .send({ painting_id: paintingId });

    const [res1, res2] = await Promise.all([p1, p2]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [201, 409], 'Exactly one request must succeed with 201 and one fail with 409 Conflict');

    // Verify database state: exactly 1 order exists for this painting
    const orders = db.prepare('SELECT * FROM orders WHERE painting_id = ?').all(paintingId);
    assert.equal(orders.length, 1, 'Only one order record must exist');
    assert.equal(orders[0].status, 'placed');

    // Verify painting is marked 'sold'
    const painting = db.prepare('SELECT * FROM paintings WHERE id = ?').get(paintingId);
    assert.equal(painting.status, 'sold');
  });

  test('Concurrent Wall Booking: exactly one succeeds (201) and one fails (409)', async () => {
    // Target date 40 days in future
    const targetDate = getOffsetDate(40);

    // Both customer 1 and customer 2 attempt to book the exact same date simultaneously
    const b1 = request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: targetDate,
        wall_size: 150,
        address: '123 Birch Lane'
      });

    const b2 = request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .send({
        booking_date: targetDate,
        wall_size: 200,
        address: '456 Cedar Road'
      });

    const [res1, res2] = await Promise.all([b1, b2]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepEqual(statuses, [201, 409], 'Exactly one booking request must succeed with 201 and one fail with 409 Conflict');

    // Verify database state: exactly 1 active booking exists for this date
    const bookings = db.prepare(`
      SELECT * FROM wall_bookings 
      WHERE booking_date = ? AND status IN ('requested', 'confirmed')
    `).all(targetDate);

    assert.equal(bookings.length, 1, 'Only one active booking can exist for the date');
  });
});
