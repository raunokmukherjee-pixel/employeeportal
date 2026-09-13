// TASK-10 — RED before app/routes/service exist. Traces: FR-05; AC-014..018.
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

async function submit(app) {
  const res = await request(app)
    .post(BASE)
    .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
    .set('Idempotency-Key', newIdempotencyKey())
    .send(validCreateBody());
  return res.body;
}

describe('POST /transfer-requests/{id}/manager-decision (TASK-10)', () => {
  test('AC-014/TC-014: the assigned manager approving moves the request to PENDING_HR_VALIDATION and notifies HR', async () => {
    const { app, notifier } = buildTestApp();
    const created = await submit(app);

    const res = await request(app)
      .post(`${BASE}/${created.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_2210))
      .send({ decision: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING_HR_VALIDATION');
    expect(notifier.events.some((e) => e.type === 'MANAGER_APPROVED')).toBe(true);
  });

  test('AC-015/TC-015: the assigned manager rejecting with a comment ends the request and notifies the employee', async () => {
    const { app, notifier } = buildTestApp();
    const created = await submit(app);

    const res = await request(app)
      .post(`${BASE}/${created.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_2210))
      .send({ decision: 'REJECTED', comment: 'role mismatch with current team plans' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('MANAGER_REJECTED');
    expect(res.body.timeline.at(-1).comment).toBe('role mismatch with current team plans');
    expect(notifier.events.some((e) => e.type === 'MANAGER_REJECTED' && e.toUserId === 'emp-4471')).toBe(true);
  });

  test('AC-016/TC-016: rejecting without a comment is rejected with 400, status unchanged', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);

    const res = await request(app)
      .post(`${BASE}/${created.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_2210))
      .send({ decision: 'REJECTED' });

    expect(res.status).toBe(400);
  });

  test('AC-017/TC-017: a manager who is not assigned to the request gets 403, status unchanged', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);

    const res = await request(app)
      .post(`${BASE}/${created.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_WRONG))
      .send({ decision: 'APPROVED' });

    expect(res.status).toBe(403);
  });

  test('AC-018/TC-018: deciding a request that is no longer SUBMITTED returns 409', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    await request(app).post(`${BASE}/${created.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });

    const res = await request(app)
      .post(`${BASE}/${created.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_2210))
      .send({ decision: 'APPROVED' });

    expect(res.status).toBe(409);
  });

  test('a non-manager role (e.g. EMPLOYEE) is not even a plausible caller for this route', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    const res = await request(app)
      .post(`${BASE}/${created.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_5001))
      .send({ decision: 'APPROVED' });
    expect(res.status).toBe(403);
  });
});
