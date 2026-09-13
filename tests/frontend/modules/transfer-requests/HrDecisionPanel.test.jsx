// employee-transfer-webapp.TC-F09/F10 (AC-F08/F09).
import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils.jsx';
import { HrDecisionPanel } from '@/modules/transfer-requests/components/HrDecisionPanel.jsx';

const HR = { userId: 'hr-001', roles: ['HR'] };

const PENDING_HR_REQUEST = {
  id: 'tr-1',
  status: 'PENDING_HR_VALIDATION',
  employeeId: 'emp-4471',
  managerId: 'mgr-2210',
};

function Harness({ initialRequest }) {
  const [request, setRequest] = useState(initialRequest);
  return (
    <div>
      <span data-testid="status">{request.status}</span>
      <ul>
        {(request.tasks || []).map((t) => (
          <li key={t.taskType}>{t.taskType}:{t.status}</li>
        ))}
      </ul>
      <HrDecisionPanel request={request} onDecided={setRequest} />
    </div>
  );
}

describe('HrDecisionPanel', () => {
  it('TC-F09: Approve shows the org-update completed and lists fanned-out tasks from the response', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...PENDING_HR_REQUEST,
        status: 'IN_PROGRESS',
        tasks: [
          { taskType: 'ORG_UPDATE', status: 'COMPLETED' },
          { taskType: 'PAYROLL', status: 'PENDING' },
          { taskType: 'IT', status: 'PENDING' },
        ],
      }),
    });

    renderWithProviders(<Harness initialRequest={PENDING_HR_REQUEST} />, { identity: HR });

    await user.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('IN_PROGRESS'));
    expect(screen.getByText(/ORG_UPDATE:COMPLETED/)).toBeInTheDocument();
    expect(screen.getByText(/PAYROLL:PENDING/)).toBeInTheDocument();
    expect(screen.getByText(/IT:PENDING/)).toBeInTheDocument();

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/v1/transfer-requests/tr-1/hr-decision');
    expect(JSON.parse(options.body)).toEqual({ decision: 'APPROVED' });
  });

  it('TC-F10: Reject requires a comment before it is enabled', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...PENDING_HR_REQUEST, status: 'HR_REJECTED' }),
    });

    renderWithProviders(<Harness initialRequest={PENDING_HR_REQUEST} />, { identity: HR });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    expect(rejectButton).toBeDisabled();

    await user.type(screen.getByLabelText(/comment/i), 'Not eligible per policy');
    expect(rejectButton).toBeEnabled();

    await user.click(rejectButton);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('HR_REJECTED'));
    const [, options] = global.fetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ decision: 'REJECTED', comment: 'Not eligible per policy' });
  });

  it('renders nothing for a non-HR identity', () => {
    renderWithProviders(<Harness initialRequest={PENDING_HR_REQUEST} />, {
      identity: { userId: 'emp-4471', roles: ['EMPLOYEE'] },
    });

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });
});
