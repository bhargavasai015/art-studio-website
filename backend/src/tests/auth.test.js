import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { request, resetTestDb } from './testHelper.js';

describe('Authentication & RBAC Tests', () => {
  before(() => {
    resetTestDb();
  });

  test('Public registration creates a customer account and prevents admin escalation', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({
        email: 'hacker@example.com',
        password: 'Password123!',
        full_name: 'Privilege Attempt',
        role: 'admin' // Attempting to escalate role
      })
      .expect(201);

    assert.equal(res.body.user.role, 'customer', 'Server must enforce customer role on registration');
    assert.ok(res.body.token, 'Should return authentication token');
  });

  test('Registration fails with invalid email or short password', async () => {
    await request
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: '123',
        full_name: 'Short'
      })
      .expect(400);
  });

  test('Login succeeds with valid customer credentials', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'CustomerPassword123!'
      })
      .expect(200);

    assert.equal(res.body.user.role, 'customer');
    assert.ok(res.body.token);
  });

  test('Login succeeds with valid admin credentials', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({
        email: 'admin@artstudio.com',
        password: 'AdminPassword123!'
      })
      .expect(200);

    assert.equal(res.body.user.role, 'admin');
    assert.ok(res.body.token);
  });

  test('Login fails with invalid password (401)', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'WrongPassword!'
      })
      .expect(401);

    assert.match(res.body.error, /invalid email or password/i);
  });

  test('Protected endpoint without token returns 401', async () => {
    const res = await request.get('/api/orders').expect(401);
    assert.match(res.body.error, /authentication required/i);
  });

  test('Protected endpoint with invalid token returns 401', async () => {
    const res = await request
      .get('/api/orders')
      .set('Authorization', 'Bearer invalid-garbage-token')
      .expect(401);

    assert.match(res.body.error, /invalid or expired/i);
  });
});
