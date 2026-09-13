// TASK-03 — single source of truth for transition legality (Technical-Plan.md §5 / ADR-04).
// Route handlers and the fan-out/completion logic must call transition() rather than
// re-implementing status checks inline (AC-018, AC-030, AC-035 depend on this).
const { STATUS, EVENTS } = require('./constants');

const TRANSITIONS = {
  [`${STATUS.SUBMITTED}|${EVENTS.MANAGER_APPROVE}`]: STATUS.PENDING_HR_VALIDATION,
  [`${STATUS.SUBMITTED}|${EVENTS.MANAGER_REJECT}`]: STATUS.MANAGER_REJECTED,
  [`${STATUS.SUBMITTED}|${EVENTS.CANCEL}`]: STATUS.CANCELLED,
  [`${STATUS.PENDING_HR_VALIDATION}|${EVENTS.HR_APPROVE}`]: STATUS.IN_PROGRESS,
  [`${STATUS.PENDING_HR_VALIDATION}|${EVENTS.HR_REJECT}`]: STATUS.HR_REJECTED,
  [`${STATUS.PENDING_HR_VALIDATION}|${EVENTS.CANCEL}`]: STATUS.CANCELLED,
  [`${STATUS.IN_PROGRESS}|${EVENTS.ALL_TASKS_DONE}`]: STATUS.COMPLETED,
};

function transition(currentStatus, event) {
  const nextStatus = TRANSITIONS[`${currentStatus}|${event}`];
  if (!nextStatus) {
    return { ok: false, code: 'INVALID_STATE' };
  }
  return { ok: true, nextStatus };
}

module.exports = { transition };
