// TASK-05 — in-memory repository behind the RepositoryPort (ADR-03/ADR-05). The
// one-active-request constraint (AC-007) and idempotency de-duplication (AC-038) are
// enforced *inside* create() so both checks are atomic with the write, matching the
// "atomic" claim in Technical-Plan.md §4 (no separate pre-check that could race).
const { TERMINAL_STATUSES } = require('../domain/constants');

class RepositoryError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function isActive(status) {
  return !TERMINAL_STATUSES.includes(status);
}

function createRepository() {
  const store = new Map();
  const idempotencyIndex = new Map(); // `${employeeId}::${key}` -> id

  async function create(entity) {
    if (entity.idempotencyKey) {
      const idemKey = `${entity.employeeId}::${entity.idempotencyKey}`;
      const existingId = idempotencyIndex.get(idemKey);
      if (existingId) {
        return { created: false, entity: store.get(existingId) };
      }
    }

    const hasActive = [...store.values()].some((e) => e.employeeId === entity.employeeId && isActive(e.status));
    if (hasActive) {
      throw new RepositoryError('ACTIVE_REQUEST_EXISTS', `employee ${entity.employeeId} already has an active transfer request`);
    }

    store.set(entity.id, entity);
    if (entity.idempotencyKey) {
      idempotencyIndex.set(`${entity.employeeId}::${entity.idempotencyKey}`, entity.id);
    }
    return { created: true, entity };
  }

  async function findByIdempotencyKey(employeeId, idempotencyKey) {
    if (!idempotencyKey) return null;
    const existingId = idempotencyIndex.get(`${employeeId}::${idempotencyKey}`);
    return existingId ? store.get(existingId) : null;
  }

  async function findById(id) {
    return store.has(id) ? store.get(id) : null;
  }

  async function listByEmployee(employeeId) {
    return [...store.values()]
      .filter((e) => e.employeeId === employeeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async function findActiveByEmployee(employeeId) {
    return [...store.values()].find((e) => e.employeeId === employeeId && isActive(e.status)) || null;
  }

  async function update(id, updaterFn) {
    const entity = store.get(id);
    if (!entity) {
      throw new RepositoryError('NOT_FOUND', `no transfer request with id ${id}`);
    }
    const updated = (await updaterFn(entity)) || entity;
    updated.updatedAt = new Date().toISOString();
    store.set(id, updated);
    return updated;
  }

  return { create, findById, findByIdempotencyKey, listByEmployee, findActiveByEmployee, update };
}

module.exports = { createRepository, RepositoryError };
