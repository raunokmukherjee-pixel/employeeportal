// TASK-03 — RED test written before src/domain/stateMachine.js exists.
// Traces: Feature-Spec.md §4 state diagram; AC-014,015,018,019,020,032,034,035.
const { transition } = require('../../../src/backend/domain/stateMachine');
const { STATUS, EVENTS } = require('../../../src/backend/domain/constants');

describe('stateMachine (TASK-03)', () => {
  test('AC-001/TC-001 precondition: SUBMITTED is a status the machine recognises as initial-legal', () => {
    expect(STATUS.SUBMITTED).toBe('SUBMITTED');
  });

  test('AC-014/TC-014: SUBMITTED + MANAGER_APPROVE -> PENDING_HR_VALIDATION', () => {
    expect(transition(STATUS.SUBMITTED, EVENTS.MANAGER_APPROVE)).toEqual({
      ok: true,
      nextStatus: STATUS.PENDING_HR_VALIDATION,
    });
  });

  test('AC-015/TC-015: SUBMITTED + MANAGER_REJECT -> MANAGER_REJECTED', () => {
    expect(transition(STATUS.SUBMITTED, EVENTS.MANAGER_REJECT)).toEqual({
      ok: true,
      nextStatus: STATUS.MANAGER_REJECTED,
    });
  });

  test('AC-034/TC-034 (a): SUBMITTED + CANCEL -> CANCELLED', () => {
    expect(transition(STATUS.SUBMITTED, EVENTS.CANCEL)).toEqual({
      ok: true,
      nextStatus: STATUS.CANCELLED,
    });
  });

  test('AC-019/TC-019: PENDING_HR_VALIDATION + HR_APPROVE -> IN_PROGRESS', () => {
    expect(transition(STATUS.PENDING_HR_VALIDATION, EVENTS.HR_APPROVE)).toEqual({
      ok: true,
      nextStatus: STATUS.IN_PROGRESS,
    });
  });

  test('AC-020/TC-020: PENDING_HR_VALIDATION + HR_REJECT -> HR_REJECTED', () => {
    expect(transition(STATUS.PENDING_HR_VALIDATION, EVENTS.HR_REJECT)).toEqual({
      ok: true,
      nextStatus: STATUS.HR_REJECTED,
    });
  });

  test('AC-034/TC-034 (b): PENDING_HR_VALIDATION + CANCEL -> CANCELLED', () => {
    expect(transition(STATUS.PENDING_HR_VALIDATION, EVENTS.CANCEL)).toEqual({
      ok: true,
      nextStatus: STATUS.CANCELLED,
    });
  });

  test('AC-032/TC-032: IN_PROGRESS + ALL_TASKS_DONE -> COMPLETED', () => {
    expect(transition(STATUS.IN_PROGRESS, EVENTS.ALL_TASKS_DONE)).toEqual({
      ok: true,
      nextStatus: STATUS.COMPLETED,
    });
  });

  test('AC-018/TC-018 (a): re-deciding an already-decided (terminal) request is INVALID_STATE, not a throw', () => {
    const result = transition(STATUS.MANAGER_REJECTED, EVENTS.MANAGER_APPROVE);
    expect(result).toEqual({ ok: false, code: 'INVALID_STATE' });
  });

  test('AC-018/TC-018 (b): double MANAGER_APPROVE (already past SUBMITTED) is INVALID_STATE', () => {
    const result = transition(STATUS.PENDING_HR_VALIDATION, EVENTS.MANAGER_APPROVE);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID_STATE');
  });

  test('AC-035/TC-035: CANCEL once IN_PROGRESS (already HR-approved) is INVALID_STATE', () => {
    const result = transition(STATUS.IN_PROGRESS, EVENTS.CANCEL);
    expect(result).toEqual({ ok: false, code: 'INVALID_STATE' });
  });

  test('every terminal status rejects every event', () => {
    const terminals = [STATUS.COMPLETED, STATUS.MANAGER_REJECTED, STATUS.HR_REJECTED, STATUS.CANCELLED];
    const events = Object.values(EVENTS);
    for (const status of terminals) {
      for (const event of events) {
        expect(transition(status, event).ok).toBe(false);
      }
    }
  });
});
