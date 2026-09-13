// TASK-12 (completion sub-module) — RED test before src/domain/completion.js exists.
// Traces: AC-032, AC-033.
const { isReadyToComplete } = require('../../../src/backend/domain/completion');

describe('isReadyToComplete (TASK-12)', () => {
  test('AC-033/TC-033: false while a required downstream task is still PENDING', () => {
    const tasks = [
      { taskType: 'ORG_UPDATE', status: 'COMPLETED' },
      { taskType: 'PAYROLL', status: 'PENDING' },
      { taskType: 'IT', status: 'NOT_REQUIRED' },
      { taskType: 'FACILITIES', status: 'NOT_REQUIRED' },
    ];
    expect(isReadyToComplete(tasks)).toBe(false);
  });

  test('AC-032/TC-032: true once every required task is COMPLETED/NOT_REQUIRED and ORG_UPDATE is COMPLETED', () => {
    const tasks = [
      { taskType: 'ORG_UPDATE', status: 'COMPLETED' },
      { taskType: 'PAYROLL', status: 'COMPLETED' },
      { taskType: 'IT', status: 'COMPLETED' },
      { taskType: 'FACILITIES', status: 'NOT_REQUIRED' },
    ];
    expect(isReadyToComplete(tasks)).toBe(true);
  });

  test('defensive: false if ORG_UPDATE itself has not completed, even if others are done', () => {
    const tasks = [
      { taskType: 'ORG_UPDATE', status: 'PENDING' },
      { taskType: 'PAYROLL', status: 'NOT_REQUIRED' },
      { taskType: 'IT', status: 'NOT_REQUIRED' },
      { taskType: 'FACILITIES', status: 'NOT_REQUIRED' },
    ];
    expect(isReadyToComplete(tasks)).toBe(false);
  });

  test('true when every task is NOT_REQUIRED except ORG_UPDATE (minimal transfer)', () => {
    const tasks = [
      { taskType: 'ORG_UPDATE', status: 'COMPLETED' },
      { taskType: 'PAYROLL', status: 'NOT_REQUIRED' },
      { taskType: 'IT', status: 'NOT_REQUIRED' },
      { taskType: 'FACILITIES', status: 'NOT_REQUIRED' },
    ];
    expect(isReadyToComplete(tasks)).toBe(true);
  });
});
