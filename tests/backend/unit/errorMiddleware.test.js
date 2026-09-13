// TASK-16 — RED before src/http/errorMiddleware.js exists.
// Traces: TC-042 (no stack trace / internal detail leaked on unexpected errors).
const request = require('supertest');
const express = require('express');
const { ApiError } = require('../../../src/backend/http/errors');
const { errorMiddleware } = require('../../../src/backend/http/errorMiddleware');

function buildApp() {
  const app = express();
  app.get('/known', (req, res, next) => next(new ApiError(409, 'INVALID_STATE', 'cannot do that right now')));
  app.get('/unknown', () => {
    throw new Error('some internal detail: db connection string leaked?');
  });
  app.use(errorMiddleware);
  return app;
}

describe('errorMiddleware (TASK-16)', () => {
  test('an ApiError is mapped to its declared status and the standard envelope', async () => {
    const res = await request(buildApp()).get('/known');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: 'INVALID_STATE', message: 'cannot do that right now' } });
  });

  test('an unexpected error is mapped to a generic 500 with no internal detail leaked', async () => {
    const res = await request(buildApp()).get('/unknown');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('db connection string');
  });
});
