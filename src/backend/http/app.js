// Composition root (ADR-03): wires concrete adapters into the service and mounts routes.
// Every dependency is injected so tests can swap in fakes/spies without touching this file.
const express = require('express');
const { authMiddleware } = require('./authMiddleware');
const { errorMiddleware } = require('./errorMiddleware');
const { createTransferRequestsRouter } = require('./routes/transferRequests');
const { createTransferRequestService } = require('../domain/transferRequestService');

function createApp({ repository, hrisAdapter, notifier }) {
  const service = createTransferRequestService({ repository, hrisAdapter, notifier });

  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.use('/api/v1/transfer-requests', createTransferRequestsRouter(service));
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };
