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
    assert.ok(res.body.paintings.length >= 12, 'Must contain all 12 paintings from seedData');
  });

  test('Admin can add a new painting to the gallery', async () => {
    const res = await request
      .post('/api/paintings')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({
        title: 'Autumn Mirage in Ranthambore',
        artist: 'Meera Kumari',
        medium: 'Natural Pigments on Tussar Silk',
        dimensions: '50 x 70 cm',
        price: 8500.0,
        description: 'Vibrant study of forest deer under golden sunlight.'
      })
      .expect(201);

    assert.equal(res.body.painting.title, 'Autumn Mirage in Ranthambore');
    assert.equal(res.body.painting.status, 'available');
    assert.equal(res.body.painting.price, 8500.0);
  });

  test('Customer is refused from adding a painting (403)', async () => {
    await request
      .post('/api/paintings')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        title: 'Unauthorized Painting',
        artist: 'Customer',
        price: 1500
      })
      .expect(403);
  });

  test('Admin can edit an available painting', async () => {
    // Painting 'p-001' is available in seed data (Madhubani Peacock Garden)
    const res = await request
      .put('/api/paintings/p-001')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({
        title: 'Madhubani Peacock Garden (Master Edition)',
        price: 7200.0
      })
      .expect(200);

    assert.equal(res.body.painting.title, 'Madhubani Peacock Garden (Master Edition)');
    assert.equal(res.body.painting.price, 7200.0);
  });

  test('Admin cannot edit a sold painting (400)', async () => {
    // Painting 'p-004' is seeded as sold in seed.json
    const res = await request
      .put('/api/paintings/p-004')
      .set('Authorization', `Bearer ${tokens.adminToken}`)
      .send({
        title: 'Attempt To Edit Sold Painting'
      })
      .expect(400);

    assert.match(res.body.error, /cannot edit a sold painting/i);
  });

  test('Customer is refused from editing a painting (403)', async () => {
    await request
      .put('/api/paintings/p-001')
      .set('Authorization', `Bearer ${tokens.customer1Token}`)
      .send({
        title: 'Customer Edit Attempt'
      })
      .expect(403);
  });
});
