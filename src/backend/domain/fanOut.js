// TASK-11 fan-out sub-module — implements rule A-06 from Discovery-Analysis.md as a pure,
// independently-testable function (kept out of the HTTP handler per the TASK-11 AI prompt).
function computeRequiredTasks(current, proposed) {
  const departmentChanged = current.departmentId !== proposed.departmentId;
  const locationChanged = current.locationId !== proposed.locationId;
  const roleChanged = current.roleId !== proposed.roleId;

  return {
    PAYROLL: departmentChanged || roleChanged || locationChanged,
    IT: departmentChanged || locationChanged,
    FACILITIES: locationChanged,
  };
}

module.exports = { computeRequiredTasks };
