// TASK-04 — fake HRIS adapter (ADR-02/ADR-03: this is the port a real HRIS client would
// implement later; domain logic only ever depends on this shape, never on HTTP details).
// Seed data is fixture-only for this exercise/demo.

function seedMasterData() {
  return {
    departments: {
      'dept-100': { id: 'dept-100', name: 'Engineering' },
      'dept-101': { id: 'dept-101', name: 'Sales' },
      'dept-102': { id: 'dept-102', name: 'Marketing' },
    },
    locations: {
      'loc-blr-01': { id: 'loc-blr-01', name: 'Bengaluru' },
      'loc-del-01': { id: 'loc-del-01', name: 'Delhi NCR' },
      'loc-mum-01': { id: 'loc-mum-01', name: 'Mumbai' },
    },
    roles: {
      'role-se': { id: 'role-se', name: 'Software Engineer' },
      'role-sse': { id: 'role-sse', name: 'Senior Software Engineer' },
      'role-am': { id: 'role-am', name: 'Account Manager' },
    },
    placements: {
      'emp-4471': { departmentId: 'dept-100', locationId: 'loc-blr-01', roleId: 'role-se', managerId: 'mgr-2210' },
      'emp-5001': { departmentId: 'dept-101', locationId: 'loc-del-01', roleId: 'role-am', managerId: 'mgr-2210' },
      'emp-6002': { departmentId: 'dept-100', locationId: 'loc-blr-01', roleId: 'role-se', managerId: 'mgr-3300' },
    },
  };
}

function createFakeHrisAdapter(overrides = {}) {
  const data = seedMasterData();

  const adapter = {
    departmentExists(id) {
      return Object.prototype.hasOwnProperty.call(data.departments, id);
    },
    locationExists(id) {
      return Object.prototype.hasOwnProperty.call(data.locations, id);
    },
    roleExists(id) {
      return Object.prototype.hasOwnProperty.call(data.roles, id);
    },
    getCurrentPlacement(employeeId) {
      const placement = data.placements[employeeId];
      return placement ? { ...placement } : null;
    },
    async updateEmployeePlacement(employeeId, { departmentId, locationId, roleId }) {
      const existing = data.placements[employeeId] || {};
      data.placements[employeeId] = {
        ...existing,
        departmentId,
        locationId,
        roleId,
      };
      return { ...data.placements[employeeId] };
    },
  };

  return { ...adapter, ...overrides };
}

module.exports = { createFakeHrisAdapter };
