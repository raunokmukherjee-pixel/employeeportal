// Builds a fresh, isolated app instance per test (fresh repository/HRIS/notifier) so
// tests never leak state into each other — matches ADR-03 (ports & adapters injected,
// not module-level singletons).
const { createApp } = require('../../../src/backend/http/app');
const { createRepository } = require('../../../src/backend/adapters/repository');
const { createFakeHrisAdapter } = require('../../../src/backend/adapters/hrisAdapter');
const { createNotifier } = require('../../../src/backend/adapters/notifier');

function buildTestApp(overrides = {}) {
  const repository = overrides.repository || createRepository();
  const hrisAdapter = overrides.hrisAdapter || createFakeHrisAdapter();
  const notifier = overrides.notifier || createNotifier();
  const app = createApp({ repository, hrisAdapter, notifier });
  return { app, repository, hrisAdapter, notifier };
}

module.exports = { buildTestApp };
