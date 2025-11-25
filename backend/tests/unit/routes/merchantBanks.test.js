const request = require('supertest');
const express = require('express');
const banksRouter = require('../../../routes/api/merchant/banks');

describe('Merchant Banks Route', () => {
  const app = express();
  app.use('/api/merchant/banks', banksRouter);

  it('should return banks list with total count', async () => {
    const res = await request(app).get('/api/merchant/banks');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.banks)).toBe(true);
    expect(res.body.total).toBe(res.body.banks.length);
    expect(res.body.banks.length).toBeGreaterThan(0);
  });
});
