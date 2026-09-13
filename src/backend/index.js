// Real-run bootstrap (not exercised by tests — tests build the app directly via
// tests/backend/helpers/testApp.js against injected fakes, per ADR-03).
const { createApp } = require('./http/app');
const { createRepository } = require('./adapters/repository');
const { createFakeHrisAdapter } = require('./adapters/hrisAdapter');
const { createNotifier } = require('./adapters/notifier');

const app = createApp({
  repository: createRepository(),
  hrisAdapter: createFakeHrisAdapter(),
  notifier: createNotifier(),
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Transfer Orchestration Service listening on :${PORT}`);
});
