jest.mock('../../controllers/users', () => ({
  getUserByUsername: jest.fn((req, res) => res.json({ id: 1 })),
  getAllUsers: jest.fn((req, res) => res.json({ users: [] })),
  updateUserRole: jest.fn((req, res) => res.json({ id: 1, role: 'BANK' })),
  validateUser: jest.fn((req, res) => res.json({ valid: true }))
}));
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

const express = require('express');
const request = require('supertest');
const router = require('../../routes/users');

const app = express();
app.use(express.json());
app.use('/', router);

describe('routes/users', () => {
  it('GET /user/:username should call getUserByUsername', async () => {
    const res = await request(app).get('/user/testuser');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1 });
  });

  it('GET /users should call getAllUsers with auth', async () => {
    const { authenticateToken } = require('../../middleware/auth');
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(authenticateToken).toHaveBeenCalled();
  });

  it('PUT /users/:userId/role should call updateUserRole with auth', async () => {
    const res = await request(app).put('/users/1/role').send({ role: 'BANK' });
    expect(res.status).toBe(200);
  });

  it('GET /validate should call validateUser', async () => {
    const res = await request(app).get('/validate?username=test&email_address=test@test.com');
    expect(res.status).toBe(200);
  });
});
