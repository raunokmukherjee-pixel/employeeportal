// TASK-14 — RED before app/routes/service exist. Traces: FR-14; AC-037.
// "Exactly one notification event per transition" — a transition that is itself composed
// of two logical transitions (the last downstream task completing AND that completion
// triggering auto-completion) is asserted as exactly two events, one per transition, per
// the Given clause of AC-037 in Feature-Spec.md §9 ("downstream completion" and
// "auto-completion" are listed as distinct transition kinds).
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

describe('Notification events (TASK-14, AC-037)', () => {
  test('submitting a request emits exactly one notification', async () => {
    const { app, notifier } = buildTestApp();
    expect(notifier.events).toHaveLength(0);

    await request(app).post(BASE).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());

    expect(notifier.events).toHaveLength(1);
    expect(notifier.events[0].type).toBe('REQUEST_SUBMITTED');
  });

  test('manager approval emits exactly one notification', async () => {
    const { app, notifier } = buildTestApp();
    const created = await request(app).post(BASE).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());

    const before = notifier.events.length;
    await request(app).post(`${BASE}/${created.body.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    expect(notifier.events).toHaveLength(before + 1);
  });

  test('manager rejection emits exactly one notification', async () => {
    const { app, notifier } = buildTestApp();
    const created = await request(app).post(BASE).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());

    const before = notifier.events.length;
    await request(app)
      .post(`${BASE}/${created.body.id}/manager-decision`)
      .set('Authorization', authHeader(IDENTITIES.MANAGER_2210))
      .send({ decision: 'REJECTED', comment: 'no headcount' });
    expect(notifier.events).toHaveLength(before + 1);
  });

  test('HR approval emits exactly one notification, even though it fans out to three teams', async () => {
    const { app, notifier } = buildTestApp();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ proposedLocationId: 'loc-del-01' }));
    await request(app).post(`${BASE}/${created.body.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });

    const before = notifier.events.length;
    const res = await request(app).post(`${BASE}/${created.body.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });

    expect(notifier.events).toHaveLength(before + 1);
    const event = notifier.events.at(-1);
    expect(event.type).toBe('HR_APPROVED');
    expect(event.toRoles.sort()).toEqual(['FACILITIES', 'IT', 'PAYROLL']);
    expect(res.status).toBe(200);
  });

  test('a downstream completion that is NOT the last required task emits exactly one notification', async () => {
    const { app, notifier } = buildTestApp();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ proposedLocationId: 'loc-del-01' }));
    await request(app).post(`${BASE}/${created.body.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    await request(app).post(`${BASE}/${created.body.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });

    const before = notifier.events.length;
    await request(app).post(`${BASE}/${created.body.id}/tasks/PAYROLL/complete`).set('Authorization', authHeader(IDENTITIES.PAYROLL_USER)).send();
    expect(notifier.events).toHaveLength(before + 1);
    expect(notifier.events.at(-1).type).toBe('DOWNSTREAM_TASK_UPDATED');
  });

  test('the LAST required task completing emits two notifications: task update + request completed', async () => {
    const { app, notifier } = buildTestApp();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ proposedLocationId: 'loc-del-01' }));
    await request(app).post(`${BASE}/${created.body.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    await request(app).post(`${BASE}/${created.body.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    await request(app).post(`${BASE}/${created.body.id}/tasks/PAYROLL/complete`).set('Authorization', authHeader(IDENTITIES.PAYROLL_USER)).send();
    await request(app).post(`${BASE}/${created.body.id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();

    const before = notifier.events.length;
    await request(app).post(`${BASE}/${created.body.id}/tasks/FACILITIES/complete`).set('Authorization', authHeader(IDENTITIES.FACILITIES_USER)).send();

    expect(notifier.events).toHaveLength(before + 2);
    const types = notifier.events.slice(before).map((e) => e.type);
    expect(types).toEqual(['DOWNSTREAM_TASK_UPDATED', 'REQUEST_COMPLETED']);
  });

  test('cancellation emits exactly one notification', async () => {
    const { app, notifier } = buildTestApp();
    const created = await request(app).post(BASE).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());

    const before = notifier.events.length;
    await request(app).post(`${BASE}/${created.body.id}/cancel`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).send();
    expect(notifier.events).toHaveLength(before + 1);
    expect(notifier.events.at(-1).type).toBe('REQUEST_CANCELLED');
  });
});
