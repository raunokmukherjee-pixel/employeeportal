// TASK-15 — RED test before src/http/authMiddleware.js exists.
// Traces: NFR-02, TC-040, and the AC-017/022/031/036 role-guard pattern re-used per route.
const request = require('supertest');
const express = require('express');
const { authMiddleware, encodeToken, requireRole } = require('../../../src/backend/http/authMiddleware');
const { errorMiddleware } = require('../../../src/backend/http/errorMiddleware');

function buildTestApp() {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.get('/whoami', (req, res) => res.json(req.auth));
  app.get('/hr-only', requireRole('HR'), (req, res) => res.json({ ok: true }));
  app.use(errorMiddleware);
  return app;
}

describe('authMiddleware / requireRole (TASK-15)', () => {
  test('TC-040: missing Authorization header -> 401 UNAUTHENTICATED', async () => {
    const res = await request(buildTestApp()).get('/whoami');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  test('malformed bearer token -> 401 UNAUTHENTICATED', async () => {
    const res = await request(buildTestApp()).get('/whoami').set('Authorization', 'Bearer not-a-valid-token');
    expect(res.status).toBe(401);
  });

  test('non-Bearer scheme -> 401 UNAUTHENTICATED', async () => {
    const res = await request(buildTestApp()).get('/whoami').set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
  });

  test('valid token attaches req.auth = { userId, roles }', async () => {
    const token = encodeToken({ userId: 'emp-4471', roles: ['EMPLOYEE'] });
    const res = await request(buildTestApp()).get('/whoami').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: 'emp-4471', roles: ['EMPLOYEE'] });
  });

  test('AC-022 pattern: requireRole(HR) rejects a non-HR token with 403 FORBIDDEN', async () => {
    const token = encodeToken({ userId: 'mgr-2210', roles: ['MANAGER'] });
    const res = await request(buildTestApp()).get('/hr-only').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('requireRole(HR) allows a token carrying the HR role', async () => {
    const token = encodeToken({ userId: 'hr-001', roles: ['HR'] });
    const res = await request(buildTestApp()).get('/hr-only').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
