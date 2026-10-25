import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { request, getAuthTokens } from './testHelper.js';

describe('Paintings Gallery & Permissions Tests', () => {
  let tokens;

  before(async () => {
    tokens = await getAuthTokens();
  });

  test('Public can browse paintings collection', async () => {
    const res = await request.get('/api/paintings').expect(200);
    assert.ok(Array.isArray(res.body.paintings));
    assert.ok(res.body.paintings.length >= 8);
  });

  test('Admin can add a new painting to the gallery', async () => {
    const res = await request
      .post('/api/paintings')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({
        title: 'Autumn Mirage',
        artist: 'Elena Rostova',
        medium: 'Oil on Canvas',
        dimensions: '30" x 40"',
        price: 520.0,
        description: 'Warm study of light through oak leaves.'
      })
      .expect(201);

    assert.equal(res.body.painting.title, 'Autumn Mirage');
    assert.equal(res.body.painting.status, 'available');
  });

  test('Customer is refused from adding a painting (403)', async () => {
    await request
      .post('/api/paintings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        title: 'Unauthorized Painting',
        artist: 'Customer',
        price: 100
      })
      .expect(403);
  });

  test('Admin can edit an available painting', async () => {
    // Painting #1 is available
    const res = await request
      .put('/api/paintings/1')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({
        title: 'Echoes of the Mediterranean (Updated)',
        price: 680.0
      })
      .expect(200);

    assert.equal(res.body.painting.title, 'Echoes of the Mediterranean (Updated)');
    assert.equal(res.body.painting.price, 680.0);
  });

  test('Admin cannot edit a sold painting (400)', async () => {
    // Painting #8 was seeded as sold
    const res = await request
      .put('/api/paintings/8')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({
        title: 'Attempt To Edit Sold Painting'
      })
      .expect(400);

    assert.match(res.body.error, /cannot edit a sold painting/i);
  });

  test('Customer is refused from editing a painting (403)', async () => {
    await request
      .put('/api/paintings/1')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        title: 'Customer Edit Attempt'
      })
      .expect(403);
  });
});
