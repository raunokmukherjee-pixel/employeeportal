// TASK-04 — RED test written before src/adapters/hrisAdapter.js exists.
// Traces: AC-005, AC-006, AC-023, and the failure-injection hook needed by TASK-11.
const { createFakeHrisAdapter } = require('../../../src/backend/adapters/hrisAdapter');

describe('fake HRIS adapter (TASK-04)', () => {
  test('AC-005/TC-005: departmentExists/locationExists/roleExists reflect seeded master data', () => {
    const hris = createFakeHrisAdapter();
    expect(hris.departmentExists('dept-100')).toBe(true);
    expect(hris.departmentExists('dept-999')).toBe(false);
    expect(hris.locationExists('loc-blr-01')).toBe(true);
    expect(hris.locationExists('loc-xx-99')).toBe(false);
    expect(hris.roleExists('role-se')).toBe(true);
    expect(hris.roleExists('role-xx')).toBe(false);
  });

  test('AC-006/TC-006: getCurrentPlacement returns the seeded current placement', () => {
    const hris = createFakeHrisAdapter();
    expect(hris.getCurrentPlacement('emp-4471')).toEqual({
      departmentId: 'dept-100',
      locationId: 'loc-blr-01',
      roleId: 'role-se',
      managerId: 'mgr-2210',
    });
  });

  test('getCurrentPlacement returns null for an unknown employee', () => {
    const hris = createFakeHrisAdapter();
    expect(hris.getCurrentPlacement('emp-does-not-exist')).toBeNull();
  });

  test('AC-023/TC-023: updateEmployeePlacement mutates the placement and resolves', async () => {
    const hris = createFakeHrisAdapter();
    await hris.updateEmployeePlacement('emp-4471', {
      departmentId: 'dept-102',
      locationId: 'loc-blr-01',
      roleId: 'role-sse',
    });
    expect(hris.getCurrentPlacement('emp-4471')).toEqual({
      departmentId: 'dept-102',
      locationId: 'loc-blr-01',
      roleId: 'role-sse',
      managerId: 'mgr-2210',
    });
  });

  test('TASK-11 failure-path support: updateEmployeePlacement can be overridden to simulate an HRIS outage', async () => {
    const hris = createFakeHrisAdapter({
      updateEmployeePlacement: async () => {
        throw new Error('HRIS unavailable');
      },
    });
    await expect(hris.updateEmployeePlacement('emp-4471', {})).rejects.toThrow('HRIS unavailable');
  });

  test('each createFakeHrisAdapter() call is an isolated seed (no cross-test mutation leakage)', async () => {
    const hrisA = createFakeHrisAdapter();
    await hrisA.updateEmployeePlacement('emp-4471', {
      departmentId: 'dept-102',
      locationId: 'loc-blr-01',
      roleId: 'role-sse',
    });
    const hrisB = createFakeHrisAdapter();
    expect(hrisB.getCurrentPlacement('emp-4471').departmentId).toBe('dept-100');
  });
});
