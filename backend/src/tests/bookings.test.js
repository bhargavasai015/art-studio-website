import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { request, getAuthTokens } from './testHelper.js';
import { db } from '../db/database.js';

describe('Wall-Painting Bookings Tests', () => {
  let tokens;

  before(async () => {
    tokens = await getAuthTokens();
  });

  function getOffsetDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  test('Customer successfully books wall date between 7 and 90 days with correct rate calculation', async () => {
    const targetDate = getOffsetDate(15);
    const wallSize = 100;

    const res = await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: targetDate,
        wall_size: wallSize,
        address: '100 Sunset Boulevard, Los Angeles, CA'
      })
      .expect(201);

    assert.equal(res.body.booking.booking_date, targetDate);
    assert.equal(res.body.booking.wall_size, 100);
    assert.equal(res.body.booking.rate_per_sqft, 15.0);
    assert.equal(res.body.booking.total_price, 1500.0);
    assert.equal(res.body.booking.status, 'requested');
  });

  test('Booking fails if date is less than 7 days away (400)', async () => {
    const tooSoonDate = getOffsetDate(4);

    const res = await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: tooSoonDate,
        wall_size: 50,
        address: '100 Sunset Boulevard'
      })
      .expect(400);

    assert.match(res.body.error, /between 7 and 90 days/i);
  });

  test('Booking fails if date is more than 90 days away (400)', async () => {
    const tooFarDate = getOffsetDate(95);

    const res = await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: tooFarDate,
        wall_size: 50,
        address: '100 Sunset Boulevard'
      })
      .expect(400);

    assert.match(res.body.error, /between 7 and 90 days/i);
  });

  test('Booking fails if wall size is less than 10 sq ft (400)', async () => {
    await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: getOffsetDate(14),
        wall_size: 9,
        address: '100 Sunset Boulevard'
      })
      .expect(400);
  });

  test('Booking fails if wall size exceeds 500 sq ft (400)', async () => {
    await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: getOffsetDate(14),
        wall_size: 505,
        address: '100 Sunset Boulevard'
      })
      .expect(400);
  });

  test('Duplicate booking on the same date is rejected (409 Conflict)', async () => {
    const sameDate = getOffsetDate(25);

    // First booking succeeds
    await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: sameDate,
        wall_size: 60,
        address: 'First Address'
      })
      .expect(201);

    // Second booking on exact same date fails
    const duplicateRes = await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .send({
        booking_date: sameDate,
        wall_size: 80,
        address: 'Second Address'
      })
      .expect(409);

    assert.match(duplicateRes.body.error, /already been booked/i);
  });

  test('Admin can confirm a booking', async () => {
    // Seeded booking #1 is in requested status
    const res = await request
      .put('/api/bookings/1/confirm')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .expect(200);

    assert.equal(res.body.booking.status, 'confirmed');
  });

  test('Admin can decline a requested booking', async () => {
    // Create a new booking
    const bookRes = await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: getOffsetDate(35),
        wall_size: 45,
        address: 'Decline Test Address'
      })
      .expect(201);

    const res = await request
      .put(`/api/bookings/${bookRes.body.booking.id}/decline`)
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .expect(200);

    assert.equal(res.body.booking.status, 'declined');
  });

  test('Customer can cancel booking at least 3 days before the date', async () => {
    // Create booking 10 days away
    const bookRes = await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        booking_date: getOffsetDate(10),
        wall_size: 50,
        address: 'Cancellation Test Address'
      })
      .expect(201);

    const cancelRes = await request
      .put(`/api/bookings/${bookRes.body.booking.id}/cancel`)
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .expect(200);

    assert.equal(cancelRes.body.booking.status, 'cancelled');
  });

  test('Customer CANNOT cancel a booking within 3 days of the date (400)', async () => {
    // Directly insert a booking 2 days in future to test boundary rule
    const twoDaysDate = getOffsetDate(2);
    const insertStmt = db.prepare(`
      INSERT INTO wall_bookings (customer_id, booking_date, wall_size, rate_per_sqft, total_price, address, status)
      VALUES (?, ?, 50, 15.0, 750.0, 'Late Address', 'confirmed')
    `);
    const insertRes = insertStmt.run(tokens.customer1User.id, twoDaysDate);
    const lateBookingId = Number(insertRes.lastInsertRowid);

    const res = await request
      .put(`/api/bookings/${lateBookingId}/cancel`)
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .expect(400);

    assert.match(res.body.error, /cancellation deadline passed|at least 3 days/i);
  });

  test("Customer asking for someone else's booking gets 404 (Not Found)", async () => {
    // Booking #1 belongs to Customer 1
    const res = await request
      .get('/api/bookings/1')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .expect(404);

    assert.match(res.body.error, /booking not found/i);
  });

  test('Admin is refused from creating a booking (403)', async () => {
    await request
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({
        booking_date: getOffsetDate(20),
        wall_size: 50,
        address: 'Admin address'
      })
      .expect(403);
  });
});
