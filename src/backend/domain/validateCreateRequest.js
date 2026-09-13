// TASK-06 — request-creation validation. Implements AC-002,003,003B,004,005,006,008,009.
// Pure function: no I/O of its own beyond the injected hrisAdapter/currentPlacement/now,
// so it is testable without a running server (per the TASK-06 AI prompt).
const MIN_LEAD_DAYS = 14; // A-03 — documented default, not a hard business fact (see Gate 1 Review R-3)
const MAX_REASON_LENGTH = 1000; // AC-009

const REQUIRED_FIELDS = ['proposedDepartmentId', 'proposedLocationId', 'proposedRoleId', 'effectiveDate'];

function isBlank(value) {
  return value === undefined || value === null || value === '';
}

function parseIsoDateToUtcMs(str) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!match) return null;
  const [, y, mo, d] = match.map(Number);
  const utcMs = Date.UTC(y, mo - 1, d);
  const check = new Date(utcMs);
  const isRealCalendarDate = check.getUTCFullYear() === y && check.getUTCMonth() === mo - 1 && check.getUTCDate() === d;
  return isRealCalendarDate ? utcMs : null;
}

function validateCreateRequest({ body, currentPlacement, hrisAdapter, now = new Date() }) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (isBlank(body[field])) {
      errors.push({ field, code: 'REQUIRED', message: `${field} is required` });
    }
  }

  if (!isBlank(body.proposedDepartmentId) && !hrisAdapter.departmentExists(body.proposedDepartmentId)) {
    errors.push({ field: 'proposedDepartmentId', code: 'NOT_FOUND', message: 'proposedDepartmentId does not exist' });
  }
  if (!isBlank(body.proposedLocationId) && !hrisAdapter.locationExists(body.proposedLocationId)) {
    errors.push({ field: 'proposedLocationId', code: 'NOT_FOUND', message: 'proposedLocationId does not exist' });
  }
  if (!isBlank(body.proposedRoleId) && !hrisAdapter.roleExists(body.proposedRoleId)) {
    errors.push({ field: 'proposedRoleId', code: 'NOT_FOUND', message: 'proposedRoleId does not exist' });
  }

  if (!isBlank(body.effectiveDate)) {
    const effectiveUtcMs = parseIsoDateToUtcMs(body.effectiveDate);
    if (effectiveUtcMs === null) {
      errors.push({ field: 'effectiveDate', code: 'INVALID_DATE', message: 'effectiveDate must be a valid YYYY-MM-DD date' });
    } else {
      const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const minEffectiveUtcMs = todayUtcMs + MIN_LEAD_DAYS * 24 * 60 * 60 * 1000;
      if (effectiveUtcMs < todayUtcMs) {
        errors.push({ field: 'effectiveDate', code: 'PAST_DATE', message: 'effectiveDate must not be in the past' });
      } else if (effectiveUtcMs < minEffectiveUtcMs) {
        errors.push({
          field: 'effectiveDate',
          code: 'MIN_LEAD_TIME',
          message: `effectiveDate must be at least ${MIN_LEAD_DAYS} days from today`,
        });
      }
    }
  }

  const allOrgFieldsPresentAndValid =
    !isBlank(body.proposedDepartmentId) &&
    !isBlank(body.proposedLocationId) &&
    !isBlank(body.proposedRoleId) &&
    !errors.some((e) => ['proposedDepartmentId', 'proposedLocationId', 'proposedRoleId'].includes(e.field));

  if (allOrgFieldsPresentAndValid && currentPlacement) {
    const isNoOp =
      body.proposedDepartmentId === currentPlacement.departmentId &&
      body.proposedLocationId === currentPlacement.locationId &&
      body.proposedRoleId === currentPlacement.roleId;
    if (isNoOp) {
      errors.push({ field: null, code: 'NOT_A_TRANSFER', message: 'proposed placement is identical to current placement' });
    }
  }

  if (typeof body.reason === 'string' && body.reason.length > MAX_REASON_LENGTH) {
    errors.push({ field: 'reason', code: 'MAX_LENGTH', message: `reason must be at most ${MAX_REASON_LENGTH} characters` });
  }

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}

module.exports = { validateCreateRequest, MIN_LEAD_DAYS, MAX_REASON_LENGTH };
