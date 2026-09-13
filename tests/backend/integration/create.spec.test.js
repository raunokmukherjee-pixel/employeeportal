// TASK-07 — RED before src/http/app.js / routes / service exist.
// Traces: FR-01, FR-15; AC-001..009, AC-038.
const request = require('supertest');
const { buildTestApp } = require('../helpers/testApp');
const { IDENTITIES, authHeader } = require('../helpers/identities');
const { validCreateBody, daysFromToday, newIdempotencyKey } = require('../helpers/fixtures');

const CREATE_PATH = '/api/v1/transfer-requests';

describe('POST /transfer-requests (TASK-07)', () => {
  test('AC-001/TC-001: a fully valid submission returns 201 with status SUBMITTED and notifies the manager', async () => {
    const { app, notifier } = buildTestApp();
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody());

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('SUBMITTED');
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.managerId).toBe('mgr-2210');
    expect(notifier.events.some((e) => e.type === 'REQUEST_SUBMITTED' && e.toUserId === 'mgr-2210')).toBe(true);
  });

  test('AC-002/TC-002: missing required fields returns 400 identifying them, creates nothing', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['proposedDepartmentId', 'proposedLocationId', 'proposedRoleId', 'effectiveDate']));
  });

  test('AC-003/TC-003: effective date 13 days out fails minimum lead time', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ effectiveDate: daysFromToday(13) }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.some((d) => d.code === 'MIN_LEAD_TIME')).toBe(true);
  });

  test('AC-003B/TC-003B: effective date exactly 14 days out is accepted', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ effectiveDate: daysFromToday(14) }));

    expect(res.status).toBe(201);
  });

  test('AC-004/TC-004: past effective date is rejected', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ effectiveDate: daysFromToday(-1) }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.some((d) => d.code === 'PAST_DATE')).toBe(true);
  });

  test('AC-005/TC-005: unknown master-data id is rejected', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ proposedDepartmentId: 'dept-999' }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.some((d) => d.field === 'proposedDepartmentId')).toBe(true);
  });

  test('AC-006/TC-006: proposed placement identical to current is rejected as not-a-transfer', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ proposedDepartmentId: 'dept-100', proposedLocationId: 'loc-blr-01', proposedRoleId: 'role-se' }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.some((d) => d.code === 'NOT_A_TRANSFER')).toBe(true);
  });

  test('AC-007/TC-007: a second active request for the same employee is rejected with 409', async () => {
    const { app } = buildTestApp();
    const auth = authHeader(IDENTITIES.EMPLOYEE_4471);
    const first = await request(app).post(CREATE_PATH).set('Authorization', auth).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());
    expect(first.status).toBe(201);

    const second = await request(app).post(CREATE_PATH).set('Authorization', auth).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ACTIVE_REQUEST_EXISTS');
  });

  test('AC-007B/TC-007B: a new request is allowed once the prior one is cancelled (terminal)', async () => {
    const { app } = buildTestApp();
    const auth = authHeader(IDENTITIES.EMPLOYEE_4471);
    const first = await request(app).post(CREATE_PATH).set('Authorization', auth).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());
    await request(app).post(`${CREATE_PATH}/${first.body.id}/cancel`).set('Authorization', auth).send();

    const second = await request(app).post(CREATE_PATH).set('Authorization', auth).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());
    expect(second.status).toBe(201);
  });

  test('AC-008/TC-008: reason is optional', async () => {
    const { app } = buildTestApp();
    const body = validCreateBody();
    delete body.reason;
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.reason).toBeNull();
  });

  test('AC-009/TC-009: reason over 1000 characters is rejected', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(CREATE_PATH)
      .set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471))
      .set('Idempotency-Key', newIdempotencyKey())
      .send(validCreateBody({ reason: 'x'.repeat(1001) }));

    expect(res.status).toBe(400);
  });

  test('AC-038/TC-038: replaying the same Idempotency-Key returns the original request (200), no duplicate', async () => {
    const { app } = buildTestApp();
    const auth = authHeader(IDENTITIES.EMPLOYEE_4471);
    const key = newIdempotencyKey();
    const body = validCreateBody();

    const first = await request(app).post(CREATE_PATH).set('Authorization', auth).set('Idempotency-Key', key).send(body);
    expect(first.status).toBe(201);

    const replay = await request(app).post(CREATE_PATH).set('Authorization', auth).set('Idempotency-Key', key).send(body);
    expect(replay.status).toBe(200);
    expect(replay.body.id).toBe(first.body.id);

    const list = await request(app).get(`${CREATE_PATH}?scope=mine`).set('Authorization', auth);
    expect(list.body.items).toHaveLength(1);
  });

  test('missing Idempotency-Key header is rejected (NFR-03 precondition)', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post(CREATE_PATH).set('Authorization', authHeader(IDENTITIES.EMPLOYEE_4471)).send(validCreateBody());
    expect(res.status).toBe(400);
  });

  test('TC-040: unauthenticated request is rejected with 401', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post(CREATE_PATH).set('Idempotency-Key', newIdempotencyKey()).send(validCreateBody());
    expect(res.status).toBe(401);
  });
});
