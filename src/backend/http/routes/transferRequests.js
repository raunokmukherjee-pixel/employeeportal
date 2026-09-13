// TASK-07..13 route layer. Thin by design (Technical-Plan.md §2): parse/shape HTTP,
// delegate every decision to the service. Matches API-Contract.md endpoint-by-endpoint.
const express = require('express');
const { requireRole } = require('../authMiddleware');
const { ApiError } = require('../errors');
const { ROLES, DOWNSTREAM_TASK_TYPES } = require('../../domain/constants');

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function createTransferRequestsRouter(service) {
  const router = express.Router();

  // 1. POST /transfer-requests — FR-01/FR-15, AC-001..009, AC-038
  router.post(
    '/',
    requireRole(ROLES.EMPLOYEE),
    asyncHandler(async (req, res) => {
      const idempotencyKey = req.headers['idempotency-key'];
      if (!idempotencyKey) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Idempotency-Key header is required', [{ field: 'Idempotency-Key', code: 'REQUIRED' }]);
      }
      const { created, entity } = await service.createRequest(req.auth, req.body || {}, idempotencyKey);
      res.status(created ? 201 : 200).json(entity);
    })
  );

  // 3. GET /transfer-requests?scope=mine — FR-04, AC-012
  router.get(
    '/',
    requireRole(ROLES.EMPLOYEE),
    asyncHandler(async (req, res) => {
      const items = await service.listMine(req.auth);
      res.status(200).json({ items });
    })
  );

  // 2. GET /transfer-requests/{id} — FR-02/03, AC-010, AC-011, AC-013
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const entity = await service.getById(req.auth, req.params.id);
      res.status(200).json(entity);
    })
  );

  // 4. POST /transfer-requests/{id}/manager-decision — FR-05, AC-014..018
  router.post(
    '/:id/manager-decision',
    requireRole(ROLES.MANAGER),
    asyncHandler(async (req, res) => {
      const entity = await service.managerDecision(req.auth, req.params.id, req.body || {});
      res.status(200).json(entity);
    })
  );

  // 5. POST /transfer-requests/{id}/hr-decision — FR-06/07/08, AC-019..027
  router.post(
    '/:id/hr-decision',
    requireRole(ROLES.HR),
    asyncHandler(async (req, res) => {
      const entity = await service.hrDecision(req.auth, req.params.id, req.body || {});
      res.status(200).json(entity);
    })
  );

  // 6/7. POST /transfer-requests/{id}/tasks/{type}/complete|not-required — FR-09/10
  router.post(
    '/:id/tasks/:taskType/complete',
    asyncHandler(async (req, res) => {
      if (!DOWNSTREAM_TASK_TYPES.includes(req.params.taskType)) {
        throw new ApiError(404, 'NOT_FOUND', 'unknown task type');
      }
      const entity = await service.actOnTask(req.auth, req.params.id, req.params.taskType, 'complete', req.body && req.body.comment);
      res.status(200).json(entity);
    })
  );

  router.post(
    '/:id/tasks/:taskType/not-required',
    asyncHandler(async (req, res) => {
      if (!DOWNSTREAM_TASK_TYPES.includes(req.params.taskType)) {
        throw new ApiError(404, 'NOT_FOUND', 'unknown task type');
      }
      const entity = await service.actOnTask(req.auth, req.params.id, req.params.taskType, 'not-required', req.body && req.body.comment);
      res.status(200).json(entity);
    })
  );

  // 8. POST /transfer-requests/{id}/cancel — FR-11, AC-034..036
  router.post(
    '/:id/cancel',
    requireRole(ROLES.EMPLOYEE),
    asyncHandler(async (req, res) => {
      const entity = await service.cancel(req.auth, req.params.id);
      res.status(200).json(entity);
    })
  );

  return router;
}

module.exports = { createTransferRequestsRouter };
