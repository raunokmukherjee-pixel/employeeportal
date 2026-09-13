// TASK-06 — RED test written before src/domain/validateCreateRequest.js exists.
// Each test title carries the AC's Given/When/Then intent so a reviewer can match
// test -> AC without reading implementation code (per the TASK-06 AI prompt in
// 07-ai-prompts/AI-Prompts.md).
const { validateCreateRequest } = require('../../../src/backend/domain/validateCreateRequest');
const { createFakeHrisAdapter } = require('../../../src/backend/adapters/hrisAdapter');

const NOW = new Date('2026-08-29T00:00:00Z');

function futureDate(days, from = NOW) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('validateCreateRequest (TASK-06)', () => {
  let hris;
  let current;

  beforeEach(() => {
    hris = createFakeHrisAdapter();
    current = hris.getCurrentPlacement('emp-4471');
  });

  test('AC-001/TC-001: Given valid fields and effective date >=14 days out, When validated, Then ok:true', () => {
    const body = {
      proposedDepartmentId: 'dept-102',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: futureDate(20),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(true);
  });

  test('AC-002/TC-002: Given proposedRoleId missing, When validated, Then 400-shaped error identifies that field', () => {
    const body = { proposedDepartmentId: 'dept-102', proposedLocationId: 'loc-blr-01', effectiveDate: futureDate(20) };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'proposedRoleId')).toBe(true);
  });

  test('AC-002/TC-002: Given all four required fields missing, Then all four are identified at once', () => {
    const result = validateCreateRequest({ body: {}, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(false);
    const fields = result.errors.map((e) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining(['proposedDepartmentId', 'proposedLocationId', 'proposedRoleId', 'effectiveDate'])
    );
  });

  test('AC-003/TC-003: Given effective date 13 days out, Then rejected for minimum lead time', () => {
    const body = {
      proposedDepartmentId: 'dept-102',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: futureDate(13),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'effectiveDate' && e.code === 'MIN_LEAD_TIME')).toBe(true);
  });

  test('AC-003B/TC-003B: Given effective date exactly 14 days out, Then accepted (inclusive boundary)', () => {
    const body = {
      proposedDepartmentId: 'dept-102',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: futureDate(14),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(true);
  });

  test('AC-004/TC-004: Given a past effective date, Then rejected', () => {
    const body = {
      proposedDepartmentId: 'dept-102',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: futureDate(-1),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'effectiveDate' && e.code === 'PAST_DATE')).toBe(true);
  });

  test('AC-005/TC-005: Given an effectiveDate that is not a valid date string, Then rejected (also covers TC-042)', () => {
    const body = {
      proposedDepartmentId: 'dept-102',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: 'not-a-date',
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'effectiveDate' && e.code === 'INVALID_DATE')).toBe(true);
  });

  test('AC-005/TC-005: Given an unknown proposedDepartmentId, Then rejected', () => {
    const body = {
      proposedDepartmentId: 'dept-999',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: futureDate(20),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'proposedDepartmentId' && e.code === 'NOT_FOUND')).toBe(true);
  });

  test('AC-006/TC-006: Given proposed placement identical to current, Then rejected as not-a-transfer', () => {
    const body = {
      proposedDepartmentId: current.departmentId,
      proposedLocationId: current.locationId,
      proposedRoleId: current.roleId,
      effectiveDate: futureDate(20),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'NOT_A_TRANSFER')).toBe(true);
  });

  test('AC-008/TC-008: Given reason omitted, Then still valid', () => {
    const body = {
      proposedDepartmentId: 'dept-102',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: futureDate(20),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(true);
  });

  test('AC-009/TC-009: Given reason over 1000 characters, Then rejected', () => {
    const body = {
      proposedDepartmentId: 'dept-102',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: futureDate(20),
      reason: 'x'.repeat(1001),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'reason')).toBe(true);
  });

  test('reason at exactly 1000 characters is accepted (boundary)', () => {
    const body = {
      proposedDepartmentId: 'dept-102',
      proposedLocationId: 'loc-blr-01',
      proposedRoleId: 'role-sse',
      effectiveDate: futureDate(20),
      reason: 'x'.repeat(1000),
    };
    const result = validateCreateRequest({ body, currentPlacement: current, hrisAdapter: hris, now: NOW });
    expect(result.ok).toBe(true);
  });
});
