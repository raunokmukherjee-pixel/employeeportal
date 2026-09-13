// Thin fetch wrapper over the existing REST contract (06-api-contract/API-Contract.md) —
// no redesign, just the client side of the same 8 endpoints. Every call attaches
// `Authorization: Bearer <token>` from the current demo identity; create() additionally
// attaches a client-generated Idempotency-Key (AC-F03: the caller is responsible for
// reusing the same key across retries of the same logical submission before it settles).
const BASE_URL = '/api/v1/transfer-requests';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch (_err) {
    data = null;
  }

  if (!res.ok) {
    const envelope = data && data.error ? data.error : {};
    const err = new Error(envelope.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.code = envelope.code;
    err.details = envelope.details || [];
    throw err;
  }

  return data;
}

export function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122-ish v4 UUID for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createTransferRequest(payload, token, idempotencyKey) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function getTransferRequest(id, token) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: authHeaders(token),
  });
  return parseResponse(res);
}

export async function listMyTransferRequests(token) {
  const res = await fetch(`${BASE_URL}?scope=mine`, {
    headers: authHeaders(token),
  });
  return parseResponse(res);
}

export async function submitManagerDecision(id, body, token) {
  const res = await fetch(`${BASE_URL}/${id}/manager-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function submitHrDecision(id, body, token) {
  const res = await fetch(`${BASE_URL}/${id}/hr-decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function completeTask(id, taskType, token) {
  const res = await fetch(`${BASE_URL}/${id}/tasks/${taskType}/complete`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return parseResponse(res);
}

export async function markTaskNotRequired(id, taskType, body, token) {
  const res = await fetch(`${BASE_URL}/${id}/tasks/${taskType}/not-required`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  return parseResponse(res);
}

export async function cancelTransferRequest(id, token) {
  const res = await fetch(`${BASE_URL}/${id}/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return parseResponse(res);
}
