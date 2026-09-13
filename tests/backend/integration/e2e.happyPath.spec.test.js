// TASK-17 — proves the parts compose: full journey submit -> manager -> HR -> 3 downstream
// teams -> COMPLETED, matching the 8-step manual process in Discovery-Analysis.md §3 and
// the full SDD chain's Milestone 4 (Task -> Prompt -> Test(RED) -> Impl -> Test(GREEN)).
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, newIdempotencyKey } = require('../helpers/fixtures');

const BASE = '/api/v1/transfer-requests';

describe('End-to-end happy path (TASK-17)', () => {
  test('submit -> manager approve -> HR approve -> payroll/IT/facilities complete -> COMPLETED', async () => {
    const { app, hrisAdapter, notifier } = buildTestApp();
    const employee = authHeader(IDENTITIES.EMPLOYEE_4471);

    // Stage 1-2: employee submits, sees SUBMITTED / pending with MANAGER.
    const created = await request(app)
      .post(BASE)
      .set('Authorization', employee)
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ proposedDepartmentId: 'dept-101', proposedLocationId: 'loc-del-01', proposedRoleId: 'role-am' }));
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('SUBMITTED');
    expect(created.body.pendingWith).toEqual(['MANAGER']);
    const id = created.body.id;

    // Stage 2->3: manager confirms.
    const afterManager = await request(app).post(`${BASE}/${id}/manager-decision`).set('Authorization', authHeader(IDENTITIES.MANAGER_2210)).send({ decision: 'APPROVED' });
    expect(afterManager.body.status).toBe('PENDING_HR_VALIDATION');
    expect(afterManager.body.pendingWith).toEqual(['HR']);

    // Stage 3->4/5/6: HR validates eligibility; org update + payroll/IT/facilities fan-out.
    const afterHr = await request(app).post(`${BASE}/${id}/hr-decision`).set('Authorization', authHeader(IDENTITIES.HR_USER)).send({ decision: 'APPROVED' });
    expect(afterHr.body.status).toBe('IN_PROGRESS');
    expect(afterHr.body.pendingWith.sort()).toEqual(['FACILITIES', 'IT', 'PAYROLL']);
    expect(hrisAdapter.getCurrentPlacement('emp-4471')).toEqual({
      departmentId: 'dept-101',
      locationId: 'loc-del-01',
      roleId: 'role-am',
      managerId: 'mgr-2210',
    });

    // Employee can see exactly what's still pending, and with whom, at every step.
    let midway = await request(app).get(`${BASE}/${id}`).set('Authorization', employee);
    expect(midway.body.pendingWith.sort()).toEqual(['FACILITIES', 'IT', 'PAYROLL']);

    // Stage 5: payroll actions its task.
    await request(app).post(`${BASE}/${id}/tasks/PAYROLL/complete`).set('Authorization', authHeader(IDENTITIES.PAYROLL_USER)).send();
    midway = await request(app).get(`${BASE}/${id}`).set('Authorization', employee);
    expect(midway.body.pendingWith.sort()).toEqual(['FACILITIES', 'IT']);
    expect(midway.body.status).toBe('IN_PROGRESS');

    // Stage 6: IT actions its task.
    await request(app).post(`${BASE}/${id}/tasks/IT/complete`).set('Authorization', authHeader(IDENTITIES.IT_USER)).send();
    midway = await request(app).get(`${BASE}/${id}`).set('Authorization', employee);
    expect(midway.body.pendingWith).toEqual(['FACILITIES']);

    // Stage 7->8: facilities actions the last task -> auto COMPLETED, employee notified.
    const final = await request(app).post(`${BASE}/${id}/tasks/FACILITIES/complete`).set('Authorization', authHeader(IDENTITIES.FACILITIES_USER)).send();
    expect(final.body.status).toBe('COMPLETED');
    expect(final.body.pendingWith).toEqual([]);
    expect(notifier.events.some((e) => e.type === 'REQUEST_COMPLETED' && e.toUserId === 'emp-4471')).toBe(true);

    // Full audit trail present, in order, one entry per stakeholder action.
    const stages = final.body.timeline.map((t) => t.stage);
    expect(stages).toEqual(['EMPLOYEE', 'MANAGER', 'HR', 'PAYROLL', 'IT', 'FACILITIES', 'SYSTEM']);

    // Once COMPLETED, a second active request is allowed (this one is terminal).
    const next = await request(app)
      .post(BASE)
      .set('Authorization', employee)
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody());
    expect(next.status).toBe(201);
  });
});
