// TASK-09 — RED before app/routes/service exist. Traces: FR-04; AC-012.
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

async function submitAndCancel(app, identity) {
  const created = await request(app).post(BASE).set('Authorization', authHeader(identity)).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());
  await request(app).post(`${BASE}/${created.body.id}/cancel`).set('Authorization', authHeader(identity)).send();
  return created.body;
}

describe('GET /transfer-requests?scope=mine (TASK-09)', () => {
  test('AC-012/TC-012: returns only the caller\'s own requests, newest first, excluding other employees\'', async () => {
    const { app } = buildTestApp();

    const first = await submitAndCancel(app, IDENTITIES.EMPLOYEE_4471);
    const second = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody());

    // A different employee's request must never appear in emp-4471's list.
    await request(app).post(BASE).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_6002)).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());

    const res = await request(app).get(`${BASE}?scope=mine`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.status).toBe(200);
    expect(res.body.items.map((i) => i.id)).toEqual([second.body.id, first.id]);
    expect(res.body.items.every((i) => i.employeeId === 'emp-4471')).toBe(true);
  });

  test('an employee with no requests gets an empty list, not an error', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get(`${BASE}?scope=mine`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});
