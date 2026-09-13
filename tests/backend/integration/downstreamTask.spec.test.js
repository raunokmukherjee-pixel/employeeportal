// TASK-12 — RED before app/routes/service exist. Traces: FR-09/10; AC-028..033.
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

async function submitAndFanOutAllThree(app) {
  const created = await request(app)
    .post(BASE)
    .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
    .set('Idempotency-Key', newIdempotencyKey())
    .send(validCreateBody({ proposedLocationId: 'loc-del-01' })); // triggers PAYROLL+IT+FACILITIES
  await request(app).post(`${BASE}/${created.body.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
  await request(app).post(`${BASE}/${created.body.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
  return created.body.id;
}

describe('POST /transfer-requests/{id}/tasks/{type}/complete|not-required (TASK-12)', () => {
  test('AC-028/TC-028: the assigned team completes its task', async () => {
    const { app } = buildTestApp();
    const id = await submitAndFanOutAllThree(app);

    const res = await request(app).post(`${BASE}/${id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();
    expect(res.status).toBe(200);
    const it = res.body.tasks.find((t) => t.taskType === 'IT');
    expect(it.status).toBe('COMPLETED');
    expect(res.body.pendingWith).not.toContain('IT');
  });

  test('AC-029/TC-029: the assigned team can mark its task not-required with a comment', async () => {
    const { app } = buildTestApp();
    const id = await submitAndFanOutAllThree(app);

    const res = await request(app)
      .post(`${BASE}/${id}/tasks/FACILITIES/not-required`)
      .set('Authorization', authHeader(IDENTITIES.FACILITIES_USER))
      .send({ comment: 'employee already based at that site' });
    expect(res.status).toBe(200);
    const facilities = res.body.tasks.find((t) => t.taskType === 'FACILITIES');
    expect(facilities.status).toBe('NOT_REQUIRED');
    expect(res.body.pendingWith).not.toContain('FACILITIES');
  });

  test('AC-030/TC-030: acting on a task before HR approval (fan-out) returns 404', async () => {
    const { app } = buildTestApp();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody());

    const res = await request(app).post(`${BASE}/${created.body.id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();
    expect(res.status).toBe(404);
  });

  test('AC-031/TC-031: a user from the wrong team gets 403 and the task is unchanged', async () => {
    const { app } = buildTestApp();
    const id = await submitAndFanOutAllThree(app);

    const res = await request(app).post(`${BASE}/${id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.PAYROLL_USER)).send();
    expect(res.status).toBe(403);

    const check = await request(app).get(`${BASE}/${id}`).set('Authorization', authHeader(IDENTITIES.HR_USER));
    expect(check.body.tasks.find((t) => t.taskType === 'IT').status).toBe('PENDING');
  });

  test('AC-032/TC-032: completing the last required task auto-completes the request and notifies the employee', async () => {
    const { app, notifier } = buildTestApp();
    const id = await submitAndFanOutAllThree(app);

    await request(app).post(`${BASE}/${id}/tasks/PAYROLL/complete`).set('Authorization', authHeader(IDENTITIES.PAYROLL_USER)).send();
    await request(app).post(`${BASE}/${id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();

    const res = await request(app).post(`${BASE}/${id}/tasks/FACILITIES/complete`).set('Authorization', authHeader(IDENTITIES.FACILITIES_USER)).send();
    expect(res.body.status).toBe('COMPLETED');
    expect(notifier.events.some((e) => e.type === 'REQUEST_COMPLETED' && e.toUserId === 'emp-4471')).toBe(true);
  });

  test('AC-033/TC-033: the request stays IN_PROGRESS while any required task is still PENDING', async () => {
    const { app } = buildTestApp();
    const id = await submitAndFanOutAllThree(app);

    await request(app).post(`${BASE}/${id}/tasks/PAYROLL/complete`).set('Authorization', authHeader(IDENTITIES.PAYROLL_USER)).send();

    const res = await request(app).get(`${BASE}/${id}`).set('Authorization', authHeader(IDENTITIES.HR_USER));
    expect(res.body.status).toBe('IN_PROGRESS');
  });

  test('acting on an already-completed task returns 409', async () => {
    const { app } = buildTestApp();
    const id = await submitAndFanOutAllThree(app);
    await request(app).post(`${BASE}/${id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();

    const res = await request(app).post(`${BASE}/${id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();
    expect(res.status).toBe(409);
  });

  test('an unknown task type segment returns 404', async () => {
    const { app } = buildTestApp();
    const id = await submitAndFanOutAllThree(app);
    const res = await request(app).post(`${BASE}/${id}/tasks/ORG_UPDATE/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();
    expect(res.status).toBe(404);
  });
});
