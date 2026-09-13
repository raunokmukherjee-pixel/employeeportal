// TASK-05 — RED test before src/adapters/repository.js exists.
// Traces: AC-007, AC-007B, AC-012, AC-038, Technical-Plan.md §4 (atomic one-active-request
// constraint enforced inside the repository, not as a separate pre-check).
const { createRepository } = require('../../../src/backend/adapters/repository');

function makeEntity(overrides = {}) {
  return {
    id: 'tr-1',
    employeeId: 'emp-4471',
    status: 'SUBMITTED',
    tasks: [],
    timeline: [],
    createdAt: '2026-08-29T10:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z',
    ...overrides,
  };
}

describe('in-memory repository (TASK-05)', () => {
  test('create() then findById() round-trips the entity', async () => {
    const repo = createRepository();
    const { created, entity } = await repo.create(makeEntity());
    expect(created).toBe(true);
    expect(await repo.findById('tr-1')).toEqual(entity);
  });

  test('findById() returns null for an unknown id', async () => {
    const repo = createRepository();
    expect(await repo.findById('does-not-exist')).toBeNull();
  });

  test('AC-007/TC-007: create() rejects a second active request for the same employee', async () => {
    const repo = createRepository();
    await repo.create(makeEntity({ id: 'tr-1', status: 'SUBMITTED' }));
    await expect(repo.create(makeEntity({ id: 'tr-2', status: 'SUBMITTED' }))).rejects.toMatchObject({
      code: 'ACTIVE_REQUEST_EXISTS',
    });
    expect(await repo.findById('tr-2')).toBeNull();
  });

  test('AC-007B/TC-007B: create() succeeds once the prior request is terminal', async () => {
    const repo = createRepository();
    await repo.create(makeEntity({ id: 'tr-1', status: 'CANCELLED' }));
    const { created } = await repo.create(makeEntity({ id: 'tr-2', status: 'SUBMITTED' }));
    expect(created).toBe(true);
  });

  test('AC-012/TC-012: listByEmployee returns only that employee\'s requests, newest first', async () => {
    const repo = createRepository();
    await repo.create(makeEntity({ id: 'tr-1', employeeId: 'emp-A', status: 'CANCELLED', createdAt: '2026-01-01T00:00:00Z' }));
    await repo.create(makeEntity({ id: 'tr-2', employeeId: 'emp-A', status: 'SUBMITTED', createdAt: '2026-02-01T00:00:00Z' }));
    await repo.create(makeEntity({ id: 'tr-3', employeeId: 'emp-B', status: 'SUBMITTED', createdAt: '2026-02-02T00:00:00Z' }));
    const list = await repo.listByEmployee('emp-A');
    expect(list.map((r) => r.id)).toEqual(['tr-2', 'tr-1']);
  });

  test('AC-038/TC-038: replaying create() with the same idempotencyKey returns the original, created:false', async () => {
    const repo = createRepository();
    const first = await repo.create(makeEntity({ id: 'tr-1', idempotencyKey: 'K1' }));
    const second = await repo.create(makeEntity({ id: 'tr-2', idempotencyKey: 'K1' }));
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.entity.id).toBe('tr-1');
    expect(await repo.findById('tr-2')).toBeNull();
  });

  test('a different idempotencyKey (or none) does not collide across employees', async () => {
    const repo = createRepository();
    await repo.create(makeEntity({ id: 'tr-1', employeeId: 'emp-A', idempotencyKey: 'K1' }));
    const { created } = await repo.create(makeEntity({ id: 'tr-2', employeeId: 'emp-B', idempotencyKey: 'K1' }));
    expect(created).toBe(true);
  });

  test('update() applies an updater function and persists the result', async () => {
    const repo = createRepository();
    await repo.create(makeEntity());
    const updated = await repo.update('tr-1', (entity) => {
      entity.status = 'PENDING_HR_VALIDATION';
      return entity;
    });
    expect(updated.status).toBe('PENDING_HR_VALIDATION');
    expect((await repo.findById('tr-1')).status).toBe('PENDING_HR_VALIDATION');
  });

  test('update() on an unknown id throws NOT_FOUND', async () => {
    const repo = createRepository();
    await expect(repo.update('nope', (e) => e)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
