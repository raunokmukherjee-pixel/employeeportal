// TASK-13 — RED before app/routes/service exist. Traces: FR-11; AC-034..036.
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

async function submit(app, identity = IDENTITIES.EMPLOYEE_4471) {
  const res = await request(app).post(BASE).set('Authorization', authHeader(identity)).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());
  return res.body;
}

describe('POST /transfer-requests/{id}/cancel (TASK-13)', () => {
  test('AC-034/TC-034 (a): the owner can cancel while SUBMITTED', async () => {
    const { app, notifier } = buildTestApp();
    const created = await submit(app);

    const res = await request(app).post(`${BASE}/${created.id}/cancel`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).send();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
    expect(notifier.events.some((e) => e.type === 'REQUEST_CANCELLED')).toBe(true);
  });

  test('AC-034/TC-034 (b): the owner can cancel while PENDING_HR_VALIDATION', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    await request(app).post(`${BASE}/${created.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });

    const res = await request(app).post(`${BASE}/${created.id}/cancel`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).send();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  test('AC-035/TC-035: cancellation is blocked once IN_PROGRESS (HR already approved)', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    await request(app).post(`${BASE}/${created.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });

    const res = await request(app).post(`${BASE}/${created.id}/cancel`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).send();
    expect(res.status).toBe(409);

    const check = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(check.body.status).toBe('IN_PROGRESS');
  });

  test('AC-036/TC-036: a non-owner cannot cancel (403), status unchanged', async () => {
    const { app } = buildTestApp();
    const created = await submit(app, IDENTITIES.EMPLOYEE_4471);

    const res = await request(app).post(`${BASE}/${created.id}/cancel`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_6002)).send();
    expect(res.status).toBe(403);

    const check = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(check.body.status).toBe('SUBMITTED');
  });
});
