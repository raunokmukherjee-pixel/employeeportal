// Shared test identities, matching the seeded HRIS placements in src/adapters/hrisAdapter.js
// (emp-4471 -> mgr-2210; emp-5001 -> mgr-2210; emp-6002 -> mgr-3300).
const { encodeToken } = require('../../../src/backend/http/authMiddleware');

const IDENTITIES = {
  EMPLOYEE_4471: { userId: 'emp-4471', roles: ['EMPLOYEE'] },
  EMPLOYEE_5001: { userId: 'emp-5001', roles: ['EMPLOYEE'] },
  EMPLOYEE_6002: { userId: 'emp-6002', roles: ['EMPLOYEE'] },
  MANAGER_2210: { userId: 'mgr-2210', roles: ['MANAGER'] },
  MANAGER_3300: { userId: 'mgr-3300', roles: ['MANAGER'] },
  MANAGER_WRONG: { userId: 'mgr-0000', roles: ['MANAGER'] },
  HR_USER: { userId: 'hr-001', roles: ['HR'] },
  PAYROLL_USER: { userId: 'payroll-001', roles: ['PAYROLL'] },
  IT_USER: { userId: 'it-001', roles: ['IT'] },
  FACILITIES_USER: { userId: 'facilities-001', roles: ['FACILITIES'] },
};

function tokenFor(identity) {
  return encodeToken(identity);
}

function authHeader(identity) {
  return `Bearer ${tokenFor(identity)}`;
}

module.exports = { IDENTITIES, tokenFor, authHeader };
