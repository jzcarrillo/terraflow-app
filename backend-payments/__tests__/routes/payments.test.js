jest.mock('../../controllers/payments', () => ({
  getAllPayments: jest.fn((req, res) => res.json([])),
  getPaymentById: jest.fn((req, res) => res.json({})),
  getPaymentStatus: jest.fn((req, res) => res.json({})),
  validateLandTitlePayment: jest.fn((req, res) => res.json({ exists: false })),
  validatePaymentId: jest.fn((req, res) => res.json({ exists: false }))
}));
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

const express = require('express');
const request = require('supertest');

describe('Payment Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use('/api', require('../../routes/payments'));
  });

  it('GET /api/payments', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(200);
  });

  it('GET /api/payments/:id', async () => {
    const res = await request(app).get('/api/payments/1');
    expect(res.status).toBe(200);
  });

  it('GET /api/payments/:id/status', async () => {
    const res = await request(app).get('/api/payments/1/status');
    expect(res.status).toBe(200);
  });

  it('GET /api/validate/land-title-payment', async () => {
    const res = await request(app).get('/api/validate/land-title-payment?land_title_id=TCT-001');
    expect(res.status).toBe(200);
  });

  it('GET /api/validate/payment-id/:paymentId', async () => {
    const res = await request(app).get('/api/validate/payment-id/PAY-001');
    expect(res.status).toBe(200);
  });
});
