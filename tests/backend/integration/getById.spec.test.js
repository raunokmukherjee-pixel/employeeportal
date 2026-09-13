// TASK-08 — RED before app/routes/service exist.
// Traces: FR-02, FR-03; AC-010, AC-011, AC-013, AC-013B.
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

async function submit(app, identity = IDENTITIES.EMPLOYEE_4471, body = validCreateBody()) {
  const res = await request(app)
    .post(BASE)
    .set('Authorization', authHeader(identity))
    .set('Idempotency-Key', newIdempotencyKey())
    .send(body);
  return res.body;
}

describe('GET /transfer-requests/{id} (TASK-08)', () => {
  test('AC-010/TC-010: the owner sees full status and timeline', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.timeline.length).toBeGreaterThanOrEqual(1);
  });

  test('AC-011/TC-011: an unrelated employee cannot view another employee\'s request (403)', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_6002));
    expect(res.status).toBe(403);
  });

  test('GET on an unknown id returns 404', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get(`${BASE}/does-not-exist`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.status).toBe(404);
  });

  test('AC-013/TC-013: pendingWith is ["MANAGER"] while SUBMITTED', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.body.pendingWith).toEqual(['MANAGER']);
  });

  test('AC-013/TC-013: pendingWith is ["HR"] once the manager approves', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    await request(app)
      .post(`${BASE}/${created.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_2210))
      .send({ decision: 'APPROVED' });

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.body.status).toBe('PENDING_HR_VALIDATION');
    expect(res.body.pendingWith).toEqual(['HR']);
  });

  test('AC-013/TC-013: pendingWith lists the still-pending downstream teams once IN_PROGRESS', async () => {
    const { app } = buildTestApp();
    // location change -> PAYROLL + IT + FACILITIES all required (rule A-06).
    const created = await submit(app, IDENTITIES.EMPLOYEE_4471, validCreateBody({ proposedLocationId: 'loc-del-01' }));
    await request(app).post(`${BASE}/${created.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.body.status).toBe('IN_PROGRESS');
    expect(res.body.pendingWith.sort()).toEqual(['FACILITIES', 'IT', 'PAYROLL']);
  });

  test('AC-013B/TC-013B: pendingWith is [] once MANAGER_REJECTED', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    await request(app)
      .post(`${BASE}/${created.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_2210))
      .send({ decision: 'REJECTED', comment: 'not a fit right now' });

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.body.status).toBe('MANAGER_REJECTED');
    expect(res.body.pendingWith).toEqual([]);
  });

  test('AC-013B/TC-013B: pendingWith is [] once HR_REJECTED', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    await request(app).post(`${BASE}/${created.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    await request(app)
      .post(`${BASE}/${created.id}/hr-decision`)
      .set('Authorization', authHeader(IDENTITIES.HR_USER))
      .send({ decision: 'REJECTED', comment: 'tenure requirement not met' });

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.body.status).toBe('HR_REJECTED');
    expect(res.body.pendingWith).toEqual([]);
  });

  test('AC-013B/TC-013B: pendingWith is [] once CANCELLED', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    await request(app).post(`${BASE}/${created.id}/cancel`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).send();

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.body.status).toBe('CANCELLED');
    expect(res.body.pendingWith).toEqual([]);
  });

  test('AC-013B/TC-013B: pendingWith is [] once COMPLETED', async () => {
    const { app } = buildTestApp();
    const created = await submit(app, IDENTITIES.EMPLOYEE_4471, validCreateBody({ proposedLocationId: 'loc-del-01' }));
    await request(app).post(`${BASE}/${created.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    await request(app).post(`${BASE}/${created.id}/tasks/PAYROLL/complete`).set('Authorization', authHeader(IDENTITIES.PAYROLL_USER)).send();
    await request(app).post(`${BASE}/${created.id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();
    await request(app).post(`${BASE}/${created.id}/tasks/FACILITIES/complete`).set('Authorization', authHeader(IDENTITIES.FACILITIES_USER)).send();

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.pendingWith).toEqual([]);
  });

  test('the assigned manager can view the request even before deciding', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210));
    expect(res.status).toBe(200);
  });

  test('an HR user can view any request', async () => {
    const { app } = buildTestApp();
    const created = await submit(app);
    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.HR_USER));
    expect(res.status).toBe(200);
  });

  test('an IT user can view a request that has an IT task assigned once IN_PROGRESS', async () => {
    const { app } = buildTestApp();
    const created = await submit(app, IDENTITIES.EMPLOYEE_4471, validCreateBody({ proposedLocationId: 'loc-del-01' }));
    await request(app).post(`${BASE}/${created.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });

    const res = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.IT_USER));
    expect(res.status).toBe(200);
  });
});
