// Demo identity/session context (spec Context: stands in for the Portal SSO this service
// only ever *reads* claims from — never a login feature). Token shape matches
// implementation/src/http/authMiddleware.js's encodeToken exactly:
// base64url(JSON.stringify({ userId, roles })).
import { createContext, useContext, useMemo, useState } from 'react';
import { SEEDED_IDENTITIES } from '../constants';

const AuthContext = createContext(null);

// Browser-safe base64url encode (no reliance on Node's Buffer, since this runs in the
// browser at runtime — jsdom's btoa in tests happens to match Node's Buffer output too).
export function encodeToken({ userId, roles }) {
  const json = JSON.stringify({ userId, roles });
  const base64 =
    typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, 'utf-8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function AuthProvider({ children, initialIdentity }) {
  const [identity, setIdentity] = useState(initialIdentity || SEEDED_IDENTITIES[0]);

  const value = useMemo(
    () => ({
      identity,
      token: encodeToken(identity),
      identities: SEEDED_IDENTITIES,
      setIdentity,
    }),
    [identity]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
