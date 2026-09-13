// employee-transfer-webapp.TC-F07/F08 (AC-F06/F07).
import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils.jsx';
import { ManagerDecisionPanel } from '@/modules/transfer-requests/components/ManagerDecisionPanel.jsx';

const MANAGER = { userId: 'mgr-2210', roles: ['MANAGER'] };

const SUBMITTED_REQUEST = {
  id: 'tr-1',
  status: 'SUBMITTED',
  employeeId: 'emp-4471',
  managerId: 'mgr-2210',
};

function Harness({ initialRequest }) {
  const [request, setRequest] = useState(initialRequest);
  return (
    <div>
      <span data-testid="status">{request.status}</span>
      <ManagerDecisionPanel request={request} onDecided={setRequest} />
    </div>
  );
}

describe('ManagerDecisionPanel', () => {
  it('TC-F07: Approve fires manager-decision APPROVED and the UI reflects PENDING_HR_VALIDATION', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...SUBMITTED_REQUEST, status: 'PENDING_HR_VALIDATION' }),
    });

    renderWithProviders(<Harness initialRequest={SUBMITTED_REQUEST} />, { identity: MANAGER });

    await user.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('PENDING_HR_VALIDATION'));

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/v1/transfer-requests/tr-1/manager-decision');
    expect(JSON.parse(options.body)).toEqual({ decision: 'APPROVED' });
  });

  it('TC-F08: Reject stays disabled until a comment is entered, then submits it', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...SUBMITTED_REQUEST, status: 'MANAGER_REJECTED' }),
    });

    renderWithProviders(<Harness initialRequest={SUBMITTED_REQUEST} />, { identity: MANAGER });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    expect(rejectButton).toBeDisabled();

    await user.type(screen.getByLabelText(/comment/i), 'Not a good fit right now');
    expect(rejectButton).toBeEnabled();

    await user.click(rejectButton);

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('MANAGER_REJECTED'));

    const [, options] = global.fetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      decision: 'REJECTED',
      comment: 'Not a good fit right now',
    });
  });

  it('renders nothing for an identity that is not the assigned manager', () => {
    renderWithProviders(
      <Harness initialRequest={SUBMITTED_REQUEST} />,
      { identity: { userId: 'mgr-9999', roles: ['MANAGER'] } }
    );

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });
});
