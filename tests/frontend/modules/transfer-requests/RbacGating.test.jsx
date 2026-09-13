// employee-transfer-webapp.TC-F15 (AC-F14): actions the current identity may not perform
// are never rendered, and a direct route to one renders a not-permitted message, never a
// crash. Per-component negative-rendering cases (ManagerDecisionPanel/HrDecisionPanel/
// TaskQueue hiding their controls for the wrong identity, RequestDetail's 403 handling) are
// already covered in their own suites — this file focuses on page-level direct-navigation
// gating that those component suites don't exercise.
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils.jsx';
import { NewRequestPage } from '@/modules/transfer-requests/pages/NewRequestPage.jsx';
import { MyRequestsPage } from '@/modules/transfer-requests/pages/MyRequestsPage.jsx';
import { TaskQueuePage } from '@/modules/transfer-requests/pages/TaskQueuePage.jsx';

const MANAGER = { userId: 'mgr-2210', roles: ['MANAGER'] };
const EMPLOYEE = { userId: 'emp-4471', roles: ['EMPLOYEE'] };
const IT_USER = { userId: 'it-001', roles: ['IT'] };

describe('RBAC-gated page rendering', () => {
  it('a Manager navigating directly to New Request sees a not-permitted message, not a crash', () => {
    renderWithProviders(<NewRequestPage />, { identity: MANAGER });

    expect(screen.getByRole('alert')).toHaveTextContent(/employee/i);
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument();
  });

  it('an Employee navigating to New Request sees the form', () => {
    renderWithProviders(<NewRequestPage />, { identity: EMPLOYEE });

    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('an HR identity navigating directly to My Requests sees a not-permitted message', () => {
    renderWithProviders(<MyRequestsPage />, { identity: { userId: 'hr-001', roles: ['HR'] } });

    expect(screen.getByRole('alert')).toHaveTextContent(/employee/i);
  });

  it('an Employee navigating directly to the downstream Task Queue sees a not-permitted message', () => {
    renderWithProviders(<TaskQueuePage />, { identity: EMPLOYEE });

    expect(screen.getByRole('alert')).toHaveTextContent(/payroll|it|facilities/i);
    expect(screen.queryByLabelText(/request id/i)).not.toBeInTheDocument();
  });

  it('an IT identity navigating to the Task Queue sees the lookup screen, not a not-permitted message', () => {
    renderWithProviders(<TaskQueuePage />, { identity: IT_USER });

    expect(screen.getByLabelText(/request id/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
