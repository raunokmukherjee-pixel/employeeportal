import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/modules/transfer-requests/hooks/useAuth.jsx';

// Shared render helper for frontend component tests: wraps a component under test with
// the same providers main.jsx wires up (router + identity/session context), so every
// test can pick a starting identity without duplicating provider boilerplate.
export function renderWithProviders(ui, { identity, route = '/' } = {}) {
  return render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider initialIdentity={identity}>{ui}</AuthProvider>
    </MemoryRouter>
  );
}
