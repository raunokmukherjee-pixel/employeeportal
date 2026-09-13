// Mirrors src/backend/domain/constants.js (STATUS/TASK_TYPES/ROLES) so the frontend never
// invents its own vocabulary for backend enums. Not imported cross-tree (frontend and
// backend are separate packages) — kept in sync by hand, same as the API contract itself.

export const STATUS = Object.freeze({
  SUBMITTED: 'SUBMITTED',
  PENDING_HR_VALIDATION: 'PENDING_HR_VALIDATION',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  MANAGER_REJECTED: 'MANAGER_REJECTED',
  HR_REJECTED: 'HR_REJECTED',
  CANCELLED: 'CANCELLED',
});

export const TERMINAL_STATUSES = Object.freeze([
  STATUS.COMPLETED,
  STATUS.MANAGER_REJECTED,
  STATUS.HR_REJECTED,
  STATUS.CANCELLED,
]);

export const TASK_TYPES = Object.freeze({
  ORG_UPDATE: 'ORG_UPDATE',
  PAYROLL: 'PAYROLL',
  IT: 'IT',
  FACILITIES: 'FACILITIES',
});

export const DOWNSTREAM_TASK_TYPES = Object.freeze([
  TASK_TYPES.PAYROLL,
  TASK_TYPES.IT,
  TASK_TYPES.FACILITIES,
]);

export const TASK_STATUS = Object.freeze({
  NOT_REQUIRED: 'NOT_REQUIRED',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
});

export const ROLES = Object.freeze({
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  HR: 'HR',
  PAYROLL: 'PAYROLL',
  IT: 'IT',
  FACILITIES: 'FACILITIES',
});

// Seeded demo identities (implementation/tests/helpers/identities.js) offered by the
// IdentitySwitcher. This is explicitly not a login feature (spec Context) — just a
// stand-in for the Portal SSO this service was always going to read claims from.
export const SEEDED_IDENTITIES = Object.freeze([
  { userId: 'emp-4471', roles: ['EMPLOYEE'], label: 'Employee — emp-4471' },
  { userId: 'emp-5001', roles: ['EMPLOYEE'], label: 'Employee — emp-5001' },
  { userId: 'emp-6002', roles: ['EMPLOYEE'], label: 'Employee — emp-6002' },
  { userId: 'mgr-2210', roles: ['MANAGER'], label: 'Manager — mgr-2210' },
  { userId: 'mgr-3300', roles: ['MANAGER'], label: 'Manager — mgr-3300' },
  { userId: 'hr-001', roles: ['HR'], label: 'HR — hr-001' },
  { userId: 'payroll-001', roles: ['PAYROLL'], label: 'Payroll — payroll-001' },
  { userId: 'it-001', roles: ['IT'], label: 'IT — it-001' },
  { userId: 'facilities-001', roles: ['FACILITIES'], label: 'Facilities — facilities-001' },
]);
