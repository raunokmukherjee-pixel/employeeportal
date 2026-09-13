// Shared HTTP error type. Route/service code throws these; errorMiddleware translates
// them into the standard envelope from API-Contract.md. Any other thrown error is treated
// as unexpected and mapped to a generic 500 (never leaks internal detail — TC-042).
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = { ApiError };
