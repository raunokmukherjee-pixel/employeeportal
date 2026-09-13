const { ApiError } = require('./errors');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.details) body.error.details = err.details;
    res.status(err.status).json(body);
    return;
  }

  // Malformed request bodies are rejected by express.json() itself (e.g. invalid JSON)
  // before any route/service code runs. That's a client error (TC-042), not a server
  // fault — body-parser marks it with a 4xx status, so map it the same way an ApiError
  // would be mapped, instead of letting it fall through to the generic 500 below.
  if (typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed request' } });
    return;
  }

  // Unexpected error: log full detail server-side, never leak it to the client (TC-042).
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}

module.exports = { errorMiddleware };
