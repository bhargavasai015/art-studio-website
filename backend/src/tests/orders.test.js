import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { request, getAuthTokens } from './testHelper.js';

describe('Painting Purchases & Orders Tests', () => {
  let tokens;

  before(async () => {
    tokens = await getAuthTokens();
  });

  test('Customer can purchase an available painting', async () => {
    // Painting #2 is available ($420.00)
    const res = await request
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({ painting_id: 2 })
      .expect(201);

    assert.equal(res.body.order.status, 'placed');
    assert.equal(res.body.order.price_paid, 420.0);

    // Verify painting status is now 'sold'
    const paintingRes = await request.get('/api/paintings/2').expect(200);
    assert.equal(paintingRes.body.painting.status, 'sold');
  });

  test('Admin is refused from buying a painting (403)', async () => {
    await request
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({ painting_id: 3 })
      .expect(403);
  });

  test('Purchasing an already sold painting returns 409 Conflict', async () => {
    // Painting #2 was just bought in test above
    const res = await request
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .send({ painting_id: 2 })
      .expect(409);

    assert.match(res.body.error, /already been purchased|just been purchased/i);
  });

  test('Customer views only their own orders', async () => {
    const res = await request
      .get('/api/orders')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .expect(200);

    assert.ok(Array.isArray(res.body.orders));
    // Customer 2 owns 0 orders right now
    for (const order of res.body.orders) {
      assert.equal(order.customer_id, tokens.customer2User.id);
    }
  });

  test('Admin views all customer orders', async () => {
    const res = await request
      .get('/api/orders')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .expect(200);

    assert.ok(Array.isArray(res.body.orders));
    assert.ok(res.body.orders.length >= 2, 'Admin should see seeded order plus test purchase');
  });

  test("Customer asking for someone else's order gets 404 (Not Found)", async () => {
    // Order #1 belongs to Customer 1
    const res = await request
      .get('/api/orders/1')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .expect(404);

    assert.match(res.body.error, /order not found/i);
  });

  test('Customer can cancel their own order and return painting to available', async () => {
    // Order #1 is customer 1's seeded order for painting #8
    const res = await request
      .put('/api/orders/1/cancel')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .expect(200);

    assert.equal(res.body.order.status, 'cancelled');

    // Verify painting #8 is now available again!
    const paintingRes = await request.get('/api/paintings/8').expect(200);
    assert.equal(paintingRes.body.painting.status, 'available');
  });

  test("Customer 2 cannot cancel Customer 1's order (returns 404)", async () => {
    // Order #2 belongs to Customer 1
    await request
      .put('/api/orders/2/cancel')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .expect(404);
  });
});
