// TASK-07..14 application/orchestration layer. Wires the pure domain modules (state
// machine, validation, fan-out, completion) to the injected ports (repository, HRIS
// adapter, notifier) per Technical-Plan.md ADR-01/03. Route handlers stay thin: they parse
// HTTP concerns and delegate every business decision here.
const crypto = require('crypto');
const { STATUS, EVENTS, TASK_TYPES, TASK_STATUS, DOWNSTREAM_TASK_TYPES } = require('./constants');
const { transition } = require('./stateMachine');
const { validateCreateRequest } = require('./validateCreateRequest');
const { computeRequiredTasks } = require('./fanOut');
const { isReadyToComplete } = require('./completion');
const { ApiError } = require('../http/errors');

function computePendingWith(status, tasks) {
  if (status === STATUS.SUBMITTED) return ['MANAGER'];
  if (status === STATUS.PENDING_HR_VALIDATION) return ['HR'];
  if (status === STATUS.IN_PROGRESS) {
    return tasks.filter((t) => DOWNSTREAM_TASK_TYPES.includes(t.taskType) && t.status === TASK_STATUS.PENDING).map((t) => t.taskType);
  }
  return [];
}

function toSummary(entity) {
  return {
    id: entity.id,
    employeeId: entity.employeeId,
    managerId: entity.managerId,
    status: entity.status,
    proposedDepartmentId: entity.proposedDepartmentId,
    proposedLocationId: entity.proposedLocationId,
    proposedRoleId: entity.proposedRoleId,
    effectiveDate: entity.effectiveDate,
    reason: entity.reason,
    pendingWith: computePendingWith(entity.status, entity.tasks),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function toDetail(entity) {
  return {
    ...toSummary(entity),
    tasks: entity.tasks.map((t) => ({ taskType: t.taskType, status: t.status, completedAt: t.completedAt || null })),
    timeline: entity.timeline.map((a) => ({
      stage: a.stage,
      decision: a.decision,
      actorId: a.actorId,
      occurredAt: a.occurredAt,
      ...(a.comment ? { comment: a.comment } : {}),
    })),
  };
}

function createTransferRequestService({ repository, hrisAdapter, notifier, idGenerator = () => crypto.randomUUID(), now = () => new Date() }) {
  async function createRequest(actor, body, idempotencyKey) {
    // Idempotency-key dedup must happen *before* validation (not just inside
    // repository.create()): validation is time-sensitive (effective-date lead time is
    // checked against wall-clock "now"), so a replay processed even slightly later than the
    // original request must short-circuit here rather than risk being re-validated against
    // a different "now" and failing differently than the original attempt succeeded.
    if (idempotencyKey) {
      const existing = await repository.findByIdempotencyKey(actor.userId, idempotencyKey);
      if (existing) {
        return { created: false, entity: toDetail(existing) };
      }
    }

    const currentPlacement = hrisAdapter.getCurrentPlacement(actor.userId);
    if (!currentPlacement) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'employee has no known HRIS placement');
    }

    const validation = validateCreateRequest({ body, currentPlacement, hrisAdapter, now: now() });
    if (!validation.ok) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'request failed validation', validation.errors);
    }

    const nowIso = now().toISOString();
    const entity = {
      id: idGenerator(),
      employeeId: actor.userId,
      managerId: currentPlacement.managerId,
      currentDepartmentId: currentPlacement.departmentId,
      currentLocationId: currentPlacement.locationId,
      currentRoleId: currentPlacement.roleId,
      proposedDepartmentId: body.proposedDepartmentId,
      proposedLocationId: body.proposedLocationId,
      proposedRoleId: body.proposedRoleId,
      effectiveDate: body.effectiveDate,
      reason: body.reason || null,
      status: STATUS.SUBMITTED,
      tasks: [],
      timeline: [{ id: idGenerator(), stage: 'EMPLOYEE', actorId: actor.userId, decision: 'SUBMITTED', comment: null, occurredAt: nowIso }],
      idempotencyKey: idempotencyKey || null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    let result;
    try {
      result = await repository.create(entity);
    } catch (err) {
      if (err.code === 'ACTIVE_REQUEST_EXISTS') {
        throw new ApiError(409, 'ACTIVE_REQUEST_EXISTS', 'employee already has an active transfer request');
      }
      throw err;
    }

    if (result.created) {
      notifier.notify({ type: 'REQUEST_SUBMITTED', transferRequestId: result.entity.id, toUserId: result.entity.managerId, occurredAt: nowIso });
    }

    return { created: result.created, entity: toDetail(result.entity) };
  }

  async function getById(actor, id) {
    const entity = await repository.findById(id);
    if (!entity) throw new ApiError(404, 'NOT_FOUND', 'transfer request not found');

    const isOwner = actor.userId === entity.employeeId;
    const isAssignedManager = actor.userId === entity.managerId;
    const isHr = actor.roles.includes('HR');
    const isAssignedDownstream = entity.tasks.some((t) => DOWNSTREAM_TASK_TYPES.includes(t.taskType) && actor.roles.includes(t.taskType));

    if (!isOwner && !isAssignedManager && !isHr && !isAssignedDownstream) {
      throw new ApiError(403, 'FORBIDDEN', 'not authorized to view this transfer request');
    }

    return toDetail(entity);
  }

  async function listMine(actor) {
    const list = await repository.listByEmployee(actor.userId);
    return list.map(toSummary);
  }

  async function managerDecision(actor, id, { decision, comment }) {
    const entity = await repository.findById(id);
    if (!entity) throw new ApiError(404, 'NOT_FOUND', 'transfer request not found');
    if (actor.userId !== entity.managerId) {
      throw new ApiError(403, 'FORBIDDEN', 'only the assigned manager may decide this request');
    }
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'decision must be APPROVED or REJECTED');
    }
    if (decision === 'REJECTED' && !comment) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'comment is required when rejecting', [{ field: 'comment', code: 'REQUIRED' }]);
    }

    const event = decision === 'APPROVED' ? EVENTS.MANAGER_APPROVE : EVENTS.MANAGER_REJECT;
    const result = transition(entity.status, event);
    if (!result.ok) {
      throw new ApiError(409, 'INVALID_STATE', 'request is not awaiting a manager decision');
    }

    const nowIso = now().toISOString();
    const updated = await repository.update(id, (e) => {
      e.status = result.nextStatus;
      e.timeline.push({ id: idGenerator(), stage: 'MANAGER', actorId: actor.userId, decision, comment: comment || null, occurredAt: nowIso });
      return e;
    });

    if (decision === 'APPROVED') {
      notifier.notify({ type: 'MANAGER_APPROVED', transferRequestId: id, toRoles: ['HR'], occurredAt: nowIso });
    } else {
      notifier.notify({ type: 'MANAGER_REJECTED', transferRequestId: id, toUserId: entity.employeeId, occurredAt: nowIso });
    }

    return toDetail(updated);
  }

  async function hrDecision(actor, id, { decision, comment }) {
    const entity = await repository.findById(id);
    if (!entity) throw new ApiError(404, 'NOT_FOUND', 'transfer request not found');
    if (!actor.roles.includes('HR')) {
      throw new ApiError(403, 'FORBIDDEN', 'only HR may decide this request');
    }
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'decision must be APPROVED or REJECTED');
    }
    if (decision === 'REJECTED' && !comment) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'comment is required when rejecting', [{ field: 'comment', code: 'REQUIRED' }]);
    }

    const event = decision === 'APPROVED' ? EVENTS.HR_APPROVE : EVENTS.HR_REJECT;
    const result = transition(entity.status, event);
    if (!result.ok) {
      throw new ApiError(409, 'INVALID_STATE', 'request is not awaiting HR validation');
    }

    const nowIso = now().toISOString();

    if (decision === 'REJECTED') {
      const updated = await repository.update(id, (e) => {
        e.status = result.nextStatus;
        e.timeline.push({ id: idGenerator(), stage: 'HR', actorId: actor.userId, decision, comment: comment || null, occurredAt: nowIso });
        return e;
      });
      notifier.notify({ type: 'HR_REJECTED', transferRequestId: id, toUserId: entity.employeeId, occurredAt: nowIso });
      return toDetail(updated);
    }

    // APPROVED: the HRIS org-data update happens synchronously and *before* any local
    // state is persisted (Technical-Plan.md §3/§6) — a failure here must leave the
    // request exactly as it was (still PENDING_HR_VALIDATION), never half-applied.
    try {
      await hrisAdapter.updateEmployeePlacement(entity.employeeId, {
        departmentId: entity.proposedDepartmentId,
        locationId: entity.proposedLocationId,
        roleId: entity.proposedRoleId,
      });
    } catch (err) {
      throw new ApiError(502, 'UPSTREAM_ERROR', 'failed to update employee placement in HRIS; request remains pending HR validation');
    }

    // HRIS has now been updated. Persisting that outcome locally is a separate step that
    // can itself fail (concurrent mutation, a real DB adapter's transient write error) — if
    // it does, HRIS and the local record have diverged and there is no automatic rollback
    // available for the HRIS write, so this is surfaced distinctly rather than silently
    // swallowed, so an operator knows manual reconciliation is required.

    const required = computeRequiredTasks(
      { departmentId: entity.currentDepartmentId, locationId: entity.currentLocationId, roleId: entity.currentRoleId },
      { departmentId: entity.proposedDepartmentId, locationId: entity.proposedLocationId, roleId: entity.proposedRoleId }
    );

    const tasks = [
      { taskType: TASK_TYPES.ORG_UPDATE, status: TASK_STATUS.COMPLETED, completedAt: nowIso, comment: null },
      { taskType: TASK_TYPES.PAYROLL, status: required.PAYROLL ? TASK_STATUS.PENDING : TASK_STATUS.NOT_REQUIRED, completedAt: null, comment: null },
      { taskType: TASK_TYPES.IT, status: required.IT ? TASK_STATUS.PENDING : TASK_STATUS.NOT_REQUIRED, completedAt: null, comment: null },
      { taskType: TASK_TYPES.FACILITIES, status: required.FACILITIES ? TASK_STATUS.PENDING : TASK_STATUS.NOT_REQUIRED, completedAt: null, comment: null },
    ];
    const requiredTeams = tasks.filter((t) => DOWNSTREAM_TASK_TYPES.includes(t.taskType) && t.status === TASK_STATUS.PENDING).map((t) => t.taskType);

    let updated;
    try {
      updated = await repository.update(id, (e) => {
        e.status = result.nextStatus;
        e.tasks = tasks;
        e.timeline.push({ id: idGenerator(), stage: 'HR', actorId: actor.userId, decision, comment: comment || null, occurredAt: nowIso });
        return e;
      });
    } catch (err) {
      throw new ApiError(
        500,
        'INCONSISTENT_STATE',
        'employee placement was updated in HRIS but the transfer request could not be persisted; manual reconciliation required'
      );
    }

    notifier.notify({ type: 'HR_APPROVED', transferRequestId: id, toRoles: requiredTeams, occurredAt: nowIso });

    if (isReadyToComplete(updated.tasks)) {
      updated = await completeIfReady(id, updated);
    }

    return toDetail(updated);
  }

  async function completeIfReady(id, entitySoFar) {
    if (!isReadyToComplete(entitySoFar.tasks)) return entitySoFar;
    const completionEvent = transition(entitySoFar.status, EVENTS.ALL_TASKS_DONE);
    if (!completionEvent.ok) return entitySoFar;

    const nowIso = now().toISOString();
    const updated = await repository.update(id, (e) => {
      e.status = completionEvent.nextStatus;
      e.timeline.push({ id: idGenerator(), stage: 'SYSTEM', actorId: 'system', decision: 'COMPLETED', comment: null, occurredAt: nowIso });
      return e;
    });
    notifier.notify({ type: 'REQUEST_COMPLETED', transferRequestId: id, toUserId: entitySoFar.employeeId, occurredAt: nowIso });
    return updated;
  }

  async function actOnTask(actor, id, taskType, action, comment) {
    const entity = await repository.findById(id);
    if (!entity) throw new ApiError(404, 'NOT_FOUND', 'transfer request not found');

    const task = entity.tasks.find((t) => t.taskType === taskType);
    if (!task) {
      throw new ApiError(404, 'NOT_FOUND', 'task not found for this transfer request (not yet fanned out, or not a downstream task type)');
    }
    if (!actor.roles.includes(taskType)) {
      throw new ApiError(403, 'FORBIDDEN', `only ${taskType} may act on this task`);
    }
    if (task.status !== TASK_STATUS.PENDING) {
      throw new ApiError(409, 'INVALID_STATE', 'task has already been actioned');
    }

    const nowIso = now().toISOString();
    const newTaskStatus = action === 'complete' ? TASK_STATUS.COMPLETED : TASK_STATUS.NOT_REQUIRED;

    let updated = await repository.update(id, (e) => {
      const t = e.tasks.find((x) => x.taskType === taskType);
      t.status = newTaskStatus;
      t.completedAt = nowIso;
      t.comment = comment || null;
      e.timeline.push({ id: idGenerator(), stage: taskType, actorId: actor.userId, decision: newTaskStatus, comment: comment || null, occurredAt: nowIso });
      return e;
    });

    notifier.notify({ type: 'DOWNSTREAM_TASK_UPDATED', transferRequestId: id, taskType, toUserId: entity.employeeId, occurredAt: nowIso });

    updated = await completeIfReady(id, updated);

    return toDetail(updated);
  }

  async function cancel(actor, id) {
    const entity = await repository.findById(id);
    if (!entity) throw new ApiError(404, 'NOT_FOUND', 'transfer request not found');
    if (actor.userId !== entity.employeeId) {
      throw new ApiError(403, 'FORBIDDEN', 'only the owning employee may cancel this request');
    }

    const result = transition(entity.status, EVENTS.CANCEL);
    if (!result.ok) {
      throw new ApiError(409, 'INVALID_STATE', 'request can no longer be cancelled');
    }

    const priorPendingWith = computePendingWith(entity.status, entity.tasks);
    const nowIso = now().toISOString();
    const updated = await repository.update(id, (e) => {
      e.status = result.nextStatus;
      e.timeline.push({ id: idGenerator(), stage: 'EMPLOYEE', actorId: actor.userId, decision: 'CANCELLED', comment: null, occurredAt: nowIso });
      return e;
    });

    notifier.notify({ type: 'REQUEST_CANCELLED', transferRequestId: id, toRoles: priorPendingWith, occurredAt: nowIso });

    return toDetail(updated);
  }

  return { createRequest, getById, listMine, managerDecision, hrDecision, actOnTask, cancel };
}

module.exports = { createTransferRequestService };
