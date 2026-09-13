// employee-transfer-webapp.TC-F01 (AC-F15): selecting a seeded identity updates the auth
// context, and everything downstream (here: a consumer reading useAuth()) reflects it
// immediately, with no page reload.
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils.jsx';
import { IdentitySwitcher } from '@/modules/transfer-requests/components/IdentitySwitcher.jsx';
import { useAuth, encodeToken } from '@/modules/transfer-requests/hooks/useAuth.jsx';

function CurrentIdentityProbe() {
  const { identity, token } = useAuth();
  return (
    <div>
      <span data-testid="probe-userId">{identity.userId}</span>
      <span data-testid="probe-roles">{identity.roles.join(',')}</span>
      <span data-testid="probe-token">{token}</span>
    </div>
  );
}

describe('IdentitySwitcher', () => {
  it('lets the user pick a seeded identity and updates the shared auth context', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <IdentitySwitcher />
        <CurrentIdentityProbe />
      </>,
      { identity: { userId: 'emp-4471', roles: ['EMPLOYEE'] } }
    );

    expect(screen.getByTestId('probe-userId')).toHaveTextContent('emp-4471');

    await user.selectOptions(screen.getByLabelText(/acting as/i), 'hr-001');

    expect(screen.getByTestId('probe-userId')).toHaveTextContent('hr-001');
    expect(screen.getByTestId('probe-roles')).toHaveTextContent('HR');
    expect(screen.getByTestId('probe-token')).toHaveTextContent(
      encodeToken({ userId: 'hr-001', roles: ['HR'] })
    );
  });

  it('offers every seeded demo identity', () => {
    renderWithProviders(<IdentitySwitcher />, {
      identity: { userId: 'emp-4471', roles: ['EMPLOYEE'] },
    });

    [
      'emp-4471',
      'emp-5001',
      'emp-6002',
      'mgr-2210',
      'mgr-3300',
      'hr-001',
      'payroll-001',
      'it-001',
      'facilities-001',
    ].forEach((userId) => {
      expect(screen.getByRole('option', { name: new RegExp(userId) })).toBeInTheDocument();
    });
  });
});
