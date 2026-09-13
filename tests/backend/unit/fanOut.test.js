// TASK-11 (fan-out sub-module) — RED test before src/domain/fanOut.js exists.
// Traces: Discovery-Analysis.md rule A-06; AC-024, AC-025, AC-026, AC-027, AC-027B.
const { computeRequiredTasks } = require('../../../src/backend/domain/fanOut');

describe('computeRequiredTasks — rule A-06 (TASK-11)', () => {
  const base = { departmentId: 'dept-100', locationId: 'loc-blr-01', roleId: 'role-se' };

  test('AC-024/TC-024 + AC-027/TC-027: role-only change -> PAYROLL required, IT/FACILITIES not required', () => {
    const result = computeRequiredTasks(base, { ...base, roleId: 'role-sse' });
    expect(result).toEqual({ PAYROLL: true, IT: false, FACILITIES: false });
  });

  test('AC-025/TC-025 + AC-027/TC-027: department-only change -> PAYROLL+IT required, FACILITIES not required', () => {
    const result = computeRequiredTasks(base, { ...base, departmentId: 'dept-101' });
    expect(result).toEqual({ PAYROLL: true, IT: true, FACILITIES: false });
  });

  test('AC-026/TC-026: location-only change -> all three required', () => {
    const result = computeRequiredTasks(base, { ...base, locationId: 'loc-del-01' });
    expect(result).toEqual({ PAYROLL: true, IT: true, FACILITIES: true });
  });

  test('AC-027B/TC-027B: department+location change together (role unchanged) -> all three required', () => {
    const result = computeRequiredTasks(base, { ...base, departmentId: 'dept-101', locationId: 'loc-del-01' });
    expect(result).toEqual({ PAYROLL: true, IT: true, FACILITIES: true });
  });

  test('no dimension changes -> nothing required (defensive; blocked earlier by AC-006 in practice)', () => {
    const result = computeRequiredTasks(base, { ...base });
    expect(result).toEqual({ PAYROLL: false, IT: false, FACILITIES: false });
  });
});
