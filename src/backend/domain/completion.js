// TASK-12 completion sub-module — implements AC-032/AC-033 as a pure function shared by
// both the "complete" and "not-required" downstream task handlers (no duplicated gating
// logic between them, per the TASK-12 AI prompt).
const { TASK_TYPES, TASK_STATUS } = require('./constants');

function isReadyToComplete(tasks) {
  const orgUpdate = tasks.find((t) => t.taskType === TASK_TYPES.ORG_UPDATE);
  if (!orgUpdate || orgUpdate.status !== TASK_STATUS.COMPLETED) {
    return false;
  }
  return tasks
    .filter((t) => t.taskType !== TASK_TYPES.ORG_UPDATE)
    .every((t) => t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.NOT_REQUIRED);
}

module.exports = { isReadyToComplete };
