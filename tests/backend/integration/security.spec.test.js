// TASK-18 — RED before this suite has been run against the implementation.
// Traces: 08-security/Security-Assessment.md; TC-041 (cross-request IDOR), TC-042
// (malformed/semantically-invalid input never produces a 500 or leaks internals).
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

async function submitApproveToInProgress(app, identity, locationId) {
  const created = await request(app)
    .post(BASE)
    .set('Authorization', authHeader(identity))
    .set('Idempotency-Key', newIdempotencyKey())
    .send(validCreateBody({ proposedLocationId: locationId }));
  const managerToken = identity === IDENTITIES.EMPLOYEE_4471 ? IDENTITIES.MANAGER_2210 : IDENTITIES.MANAGER_3300;
  await request(app).post(`${BASE}/${created.body.id}/manager-decision`).set('Authorization', authHeader(managerToken)).send({ decision: 'APPROVED' });
  await request(app).post(`${BASE}/${created.body.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
  return created.body.id;
}

describe('Security-focused tests (TASK-18)', () => {
  test('TC-041: acting on request A\'s IT task never affects request B\'s IT task (no cross-request task resolution)', async () => {
    const { app } = buildTestApp();
    const requestA = await submitApproveToInProgress(app, IDENTITIES.EMPLOYEE_4471, 'loc-del-01');
    const requestB = await submitApproveToInProgress(app, IDENTITIES.EMPLOYEE_6002, 'loc-mum-01');

    const completeA = await request(app).post(`${BASE}/${requestA}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();
    expect(completeA.status).toBe(200);

    const checkB = await request(app).get(`${BASE}/${requestB}`).set('Authorization', authHeader(IDENTITIES.IT_USER));
    expect(checkB.body.tasks.find((t) => t.taskType === 'IT').status).toBe('PENDING');
  });

  test('TC-041: an IT user with no task on request B cannot read or act on it via guessed ids', async () => {
    const { app } = buildTestApp();
    const requestA = await submitApproveToInProgress(app, IDENTITIES.EMPLOYEE_4471, 'loc-del-01');
    // requestA has an IT task, so IT_USER *can* read it (assigned-team read access) —
    // confirm that access is task-driven, not a blanket "any IT user reads any request".
    const unrelated = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_5001))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody()); // stays SUBMITTED — no IT task exists on it yet
    const res = await request(app).get(`${BASE}/${unrelated.body.id}`).set('Authorization', authHeader(IDENTITIES.IT_USER));
    expect(res.status).toBe(403);
    void requestA;
  });

  test('TC-042: a semantically-invalid effectiveDate is a 400, never a 500', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ effectiveDate: 'not-a-date' }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('TC-042: an invalid decision enum value on manager-decision is a 400, never a 500', async () => {
    const { app } = buildTestApp();
    const created = await request(app).post(BASE).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());
    const res = await request(app)
      .post(`${BASE}/${created.body.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_2210))
      .send({ decision: 'MAYBE_LATER' });
    expect(res.status).toBe(400);
  });

  test('TC-042: malformed JSON body is a 400 with the standard envelope, not a 500 with a stack trace', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json');

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at\s+\S+\s+\(.*:\d+:\d+\)/); // no stack-trace-shaped content
  });

  test('TC-042: an oversized reason does not crash the server (400, standard envelope)', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ reason: 'x'.repeat(50000) }));
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
