// TASK-11 — RED before app/routes/service exist. Traces: FR-06/07/08; AC-019..027, AC-027B.
// Includes the HRIS-outage failure path from Technical-Plan.md §3/§6 (highest-risk task).
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { createFakeHrisAdapter } = require('../../../src/backend/adapters/hrisAdapter');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

async function submitAndManagerApprove(app, body = validCreateBody()) {
  const created = await request(app)
    .post(BASE)
    .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
    .set('Idempotency-Key', newIdempotencyKey())
    .send(body);
  await request(app).post(`${BASE}/${created.body.id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
  return created.body;
}

describe('POST /transfer-requests/{id}/hr-decision (TASK-11)', () => {
  test('AC-019/TC-019: HR approval moves to IN_PROGRESS, completes ORG_UPDATE, and fans out downstream tasks', async () => {
    const { app, notifier } = buildTestApp();
    const created = await submitAndManagerApprove(app, validCreateBody({ proposedLocationId: 'loc-del-01' }));

    const res = await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_PROGRESS');
    const byType = Object.fromEntries(res.body.tasks.map((t) => [t.taskType, t.status]));
    expect(byType).toEqual({ ORG_UPDATE: 'COMPLETED', PAYROLL: 'PENDING', IT: 'PENDING', FACILITIES: 'PENDING' });
    expect(notifier.events.some((e) => e.type === 'HR_APPROVED')).toBe(true);
  });

  test('AC-020/TC-020: HR rejection with a comment ends the request and notifies the employee', async () => {
    const { app, notifier } = buildTestApp();
    const created = await submitAndManagerApprove(app);

    const res = await request(app)
      .post(`${BASE}/${created.id}/hr-decision`)
      .set('Authorization', authHeader(IDENTITIES.HR_USER))
      .send({ decision: 'REJECTED', comment: 'tenure requirement not met' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HR_REJECTED');
    expect(notifier.events.some((e) => e.type === 'HR_REJECTED' && e.toUserId === 'emp-4471')).toBe(true);
  });

  test('AC-021/TC-021: HR rejection without a comment is rejected with 400', async () => {
    const { app } = buildTestApp();
    const created = await submitAndManagerApprove(app);

    const res = await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'REJECTED' });
    expect(res.status).toBe(400);
  });

  test('AC-022/TC-022: a non-HR user cannot make an HR decision (403)', async () => {
    const { app } = buildTestApp();
    const created = await submitAndManagerApprove(app);

    const res = await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    expect(res.status).toBe(403);
  });

  test('AC-023/TC-023: ORG_UPDATE is always COMPLETED synchronously as part of HR approval', async () => {
    const { app, hrisAdapter } = buildTestApp();
    const created = await submitAndManagerApprove(app);

    await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });

    expect(hrisAdapter.getCurrentPlacement('emp-4471')).toEqual({
      departmentId: 'dept-102',
      locationId: 'loc-blr-01',
      roleId: 'role-sse',
      managerId: 'mgr-2210',
    });
  });

  test('AC-024/TC-024 + AC-027/TC-027: role-only change requires PAYROLL only', async () => {
    const { app } = buildTestApp();
    const created = await submitAndManagerApprove(app, validCreateBody({ proposedDepartmentId: 'dept-100', proposedLocationId: 'loc-blr-01', proposedRoleId: 'role-sse' }));

    const res = await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    const byType = Object.fromEntries(res.body.tasks.map((t) => [t.taskType, t.status]));
    expect(byType.PAYROLL).toBe('PENDING');
    expect(byType.IT).toBe('NOT_REQUIRED');
    expect(byType.FACILITIES).toBe('NOT_REQUIRED');
  });

  test('AC-025/TC-025 + AC-027/TC-027: department-only change requires PAYROLL+IT, not FACILITIES', async () => {
    const { app } = buildTestApp();
    const created = await submitAndManagerApprove(app, validCreateBody({ proposedDepartmentId: 'dept-101', proposedLocationId: 'loc-blr-01', proposedRoleId: 'role-se' }));

    const res = await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    const byType = Object.fromEntries(res.body.tasks.map((t) => [t.taskType, t.status]));
    expect(byType).toEqual({ ORG_UPDATE: 'COMPLETED', PAYROLL: 'PENDING', IT: 'PENDING', FACILITIES: 'NOT_REQUIRED' });
  });

  test('AC-026/TC-026: location-only change requires all three downstream tasks', async () => {
    const { app } = buildTestApp();
    const created = await submitAndManagerApprove(app, validCreateBody({ proposedDepartmentId: 'dept-100', proposedLocationId: 'loc-del-01', proposedRoleId: 'role-se' }));

    const res = await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    const byType = Object.fromEntries(res.body.tasks.map((t) => [t.taskType, t.status]));
    expect(byType).toEqual({ ORG_UPDATE: 'COMPLETED', PAYROLL: 'PENDING', IT: 'PENDING', FACILITIES: 'PENDING' });
  });

  test('AC-027B/TC-027B: department+location change together (role unchanged) requires all three', async () => {
    const { app } = buildTestApp();
    const created = await submitAndManagerApprove(app, validCreateBody({ proposedDepartmentId: 'dept-101', proposedLocationId: 'loc-del-01', proposedRoleId: 'role-se' }));

    const res = await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    const byType = Object.fromEntries(res.body.tasks.map((t) => [t.taskType, t.status]));
    expect(byType).toEqual({ ORG_UPDATE: 'COMPLETED', PAYROLL: 'PENDING', IT: 'PENDING', FACILITIES: 'PENDING' });
  });

  test('Technical-Plan §6 failure path: an HRIS outage during approval returns 502 and leaves the request PENDING_HR_VALIDATION', async () => {
    const failingHris = createFakeHrisAdapter({
      updateEmployeePlacement: async () => {
        throw new Error('HRIS unavailable');
      },
    });
    const { app } = buildTestApp({ hrisAdapter: failingHris });
    const created = await submitAndManagerApprove(app);

    const res = await request(app).post(`${BASE}/${created.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    expect(res.status).toBe(502);

    const after = await request(app).get(`${BASE}/${created.id}`).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471));
    expect(after.body.status).toBe('PENDING_HR_VALIDATION');
    expect(after.body.tasks).toEqual([]);
  });

  test('deciding a request not in PENDING_HR_VALIDATION returns 409', async () => {
    const { app } = buildTestApp();
    const created = await request(app)
      .post(BASE)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody());

    const res = await request(app).post(`${BASE}/${created.body.id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    expect(res.status).toBe(409);
  });
});
