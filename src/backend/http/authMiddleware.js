// TASK-15 — stands in for the existing Portal SSO (Discovery-Analysis.md A-11):
// this service only ever *reads* { userId, roles } claims from a bearer token; it does
// not implement login/issuance. encodeToken() exists purely so tests (and this exercise's
// demo) can mint a token shaped exactly like what real SSO would hand this service.
const { ApiError } = require('./errors');

function encodeToken({ userId, roles }) {
  return Buffer.from(JSON.stringify({ userId, roles })).toString('base64url');
}

function decodeToken(token) {
  const raw = Buffer.from(token, 'base64url').toString('utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed.userId !== 'string' || !Array.isArray(parsed.roles)) {
    throw new Error('token payload missing userId/roles');
  }
  return { userId: parsed.userId, roles: parsed.roles };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Missing or invalid Authorization header'));
    return;
  }

  try {
    req.auth = decodeToken(token);
    next();
  } catch (err) {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.roles.some((r) => roles.includes(r))) {
      next(new ApiError(403, 'FORBIDDEN', `requires role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
}

module.exports = { authMiddleware, encodeToken, requireRole };
