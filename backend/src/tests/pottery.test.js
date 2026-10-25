import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { request, getAuthTokens } from './testHelper.js';

describe('Custom Pottery Requests Tests', () => {
  let tokens;

  before(async () => {
    tokens = await getAuthTokens();
  });

  function getOffsetDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  test('Public catalog options returns pottery items and glazes from seedData', async () => {
    const res = await request.get('/api/pottery/options').expect(200);
    assert.ok(Array.isArray(res.body.items));
    assert.ok(Array.isArray(res.body.glazes));
    assert.ok(res.body.items.length >= 5);
    assert.ok(res.body.glazes.length >= 6);
  });

  test('Customer successfully requests custom pottery with valid options', async () => {
    const neededDate = getOffsetDate(21);

    const res = await request
      .post('/api/pottery')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        item_id: 'i-01', // Kulhad (clay cup)
        glaze_id: 'g-01', // Kumkum Red
        quantity: 3,
        needed_by: neededDate,
        notes: 'Slightly wider lip'
      })
      .expect(201);

    assert.equal(res.body.request.quantity, 3);
    assert.equal(res.body.request.status, 'requested');
    assert.equal(res.body.request.needed_by, neededDate);
  });

  test('Pottery request fails if needed-by date is less than 14 days away (400)', async () => {
    const tooSoonDate = getOffsetDate(10);

    const res = await request
      .post('/api/pottery')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        item_id: 'i-01',
        glaze_id: 'g-01',
        quantity: 2,
        needed_by: tooSoonDate
      })
      .expect(400);

    assert.match(res.body.error, /at least 14 days away/i);
  });

  test('Pottery request fails if quantity is outside 1 to 12 (400)', async () => {
    // 0 quantity
    await request
      .post('/api/pottery')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        item_id: 'i-01',
        glaze_id: 'g-01',
        quantity: 0,
        needed_by: getOffsetDate(20)
      })
      .expect(400);

    // 13 quantity
    await request
      .post('/api/pottery')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        item_id: 'i-01',
        glaze_id: 'g-01',
        quantity: 13,
        needed_by: getOffsetDate(20)
      })
      .expect(400);
  });

  test('Customer can edit a request while it is still requested', async () => {
    // Seeded pottery request #1 is in requested status
    const newDate = getOffsetDate(30);

    const res = await request
      .put('/api/pottery/1')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        quantity: 5,
        needed_by: newDate,
        notes: 'Updated note: gloss finish'
      })
      .expect(200);

    assert.equal(res.body.request.quantity, 5);
    assert.equal(res.body.request.needed_by, newDate);
    assert.equal(res.body.request.notes, 'Updated note: gloss finish');
  });

  test('Admin can accept a pottery request', async () => {
    const res = await request
      .put('/api/pottery/1/accept')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .expect(200);

    assert.equal(res.body.request.status, 'accepted');
  });

  test('Customer CANNOT edit an accepted pottery request (400)', async () => {
    const res = await request
      .put('/api/pottery/1')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        quantity: 6
      })
      .expect(400);

    assert.match(res.body.error, /only requests with status 'requested' can be modified/i);
  });

  test('Customer CANNOT cancel an accepted pottery request (400)', async () => {
    const res = await request
      .put('/api/pottery/1/cancel')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .expect(400);

    assert.match(res.body.error, /only requests with status 'requested' can be cancelled/i);
  });

  test('Customer can cancel a request while in requested status', async () => {
    // Create new request
    const createRes = await request
      .post('/api/pottery')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        item_id: 'i-02',
        glaze_id: 'g-02',
        quantity: 1,
        needed_by: getOffsetDate(18)
      })
      .expect(201);

    const cancelRes = await request
      .put(`/api/pottery/${createRes.body.request.id}/cancel`)
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .expect(200);

    assert.equal(cancelRes.body.request.status, 'cancelled');
  });

  test("Customer asking for someone else's pottery request gets 404 (Not Found)", async () => {
    // Request #1 belongs to Customer 1
    const res = await request
      .get('/api/pottery/1')
      .set('Authorization', `Bearer ${tokens.customer2Token}`)
      .expect(404);

    assert.match(res.body.error, /pottery request not found/i);
  });

  test('Admin is refused from creating a pottery request (403)', async () => {
    await request
      .post('/api/pottery')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({
        item_id: 'i-01',
        glaze_id: 'g-01',
        quantity: 2,
        needed_by: getOffsetDate(20)
      })
      .expect(403);
  });
});
