jest.mock('../../controllers/documents', () => ({
  getDocumentsByLandTitle: jest.fn(),
  getDocumentsByMortgage: jest.fn(),
  downloadDocument: jest.fn(),
  viewDocument: jest.fn()
}));
jest.mock('../../utils/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next())
}));

const express = require('express');
const request = require('supertest');

describe('Document Routes', () => {
  let app;

  beforeAll(() => {
    const documentController = require('../../controllers/documents');
    documentController.getDocumentsByLandTitle.mockImplementation((req, res) => res.json([]));
    documentController.getDocumentsByMortgage.mockImplementation((req, res) => res.json([]));
    documentController.downloadDocument.mockImplementation((req, res) => res.json({ ok: true }));
    documentController.viewDocument.mockImplementation((req, res) => res.json({ ok: true }));

    app = express();
    app.use('/api/documents', require('../../routes/documents'));
  });

  it('should GET /api/documents/land-title/:landTitleId', async () => {
    const res = await request(app).get('/api/documents/land-title/1');
    expect(res.status).toBe(200);
  });

  it('should GET /api/documents/mortgage/:mortgageId', async () => {
    const res = await request(app).get('/api/documents/mortgage/1');
    expect(res.status).toBe(200);
  });

  it('should GET /api/documents/download/:documentId', async () => {
    const res = await request(app).get('/api/documents/download/abc-123');
    expect(res.status).toBe(200);
  });

  it('should GET /api/documents/view/:documentId', async () => {
    const res = await request(app).get('/api/documents/view/abc-123');
    expect(res.status).toBe(200);
  });
});
