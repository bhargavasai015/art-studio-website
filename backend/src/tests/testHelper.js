import supertest from 'supertest';
import { app } from '../server.js';
import { seedDatabase } from '../db/seed.js';

export const request = supertest(app);

export function resetTestDb() {
  seedDatabase(true);
}

export async function getAuthTokens() {
  resetTestDb();

  const adminRes = await request.post('/api/auth/login').send({
    email: 'admin@artstudio.com',
    password: 'AdminPassword123!'
  });

  const customer1Res = await request.post('/api/auth/login').send({
    email: 'customer@example.com',
    password: 'CustomerPassword123!'
  });

  const customer2Res = await request.post('/api/auth/login').send({
    email: 'bob@example.com',
    password: 'BobPassword123!'
  });

  return {
    adminToken: adminRes.body.token,
    adminUser: adminRes.body.user,
    customer1Token: customer1Res.body.token,
    customer1User: customer1Res.body.user,
    customer2Token: customer2Res.body.token,
    customer2User: customer2Res.body.user
  };
}
