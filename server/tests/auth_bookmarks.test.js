const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { app } = require('../src/app');

const dbPath = path.join(__dirname, '..', 'db.json');

beforeEach(() => {
  // reset database
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], bookmarks: [] }, null, 2));
});

describe('Auth & Bookmarks API', () => {
  test('register, login, add bookmark, list, reorder, delete', async () => {
    const email = 'test@example.com';
    const password = 'Passw0rd!';
    await request(app).post('/api/auth/register').send({ email, password }).expect(201);
    const loginRes = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    expect(loginRes.body.token).toBeDefined();
    const token = loginRes.body.token;

    const addRes = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com', tags: ['test'] })
      .expect(201);
    expect(addRes.body.url).toBe('https://example.com');

    const listRes = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);

    const reorderRes = await request(app)
      .post('/api/bookmarks/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ order: listRes.body.map(b => b.id) })
      .expect(200);
    expect(reorderRes.body.message).toBe('Reordered');

    const delRes = await request(app)
      .delete(`/api/bookmarks/${addRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(delRes.body.message).toBe('Deleted successfully');
  }, 30000);
});
