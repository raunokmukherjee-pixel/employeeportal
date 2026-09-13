let counter = 0;

function daysFromToday(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function validCreateBody(overrides = {}) {
  return {
    proposedDepartmentId: 'dept-102',
    proposedLocationId: 'loc-blr-01',
    proposedRoleId: 'role-sse',
    effectiveDate: daysFromToday(20),
    reason: 'Relocating for personal reasons',
    ...overrides,
  };
}

function newIdempotencyKey() {
  counter += 1;
  return `idem-${Date.now()}-${counter}`;
}

module.exports = { daysFromToday, validCreateBody, newIdempotencyKey };
