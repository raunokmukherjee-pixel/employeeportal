// employee-transfer-webapp.TC-F11/F12 (AC-F10/F11).
import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils.jsx';
import { TaskQueue } from '@/modules/transfer-requests/components/TaskQueue.jsx';

const IT_USER = { userId: 'it-001', roles: ['IT'] };

const REQUEST_WITH_IT_PENDING = {
  id: 'tr-1',
  status: 'IN_PROGRESS',
  tasks: [
    { taskType: 'ORG_UPDATE', status: 'COMPLETED' },
    { taskType: 'PAYROLL', status: 'COMPLETED' },
    { taskType: 'IT', status: 'PENDING' },
  ],
};

function Harness({ initialRequest }) {
  const [request, setRequest] = useState(initialRequest);
  return (
    <div>
      <span data-testid="status">{request.status}</span>
      <span data-testid="it-task-status">
        {request.tasks.find((t) => t.taskType === 'IT').status}
      </span>
      <TaskQueue request={request} onUpdated={setRequest} />
    </div>
  );
}

describe('TaskQueue', () => {
  it('TC-F11: completing the last outstanding task marks it COMPLETED and the whole request COMPLETED', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...REQUEST_WITH_IT_PENDING,
        status: 'COMPLETED',
        tasks: [
          { taskType: 'ORG_UPDATE', status: 'COMPLETED' },
          { taskType: 'PAYROLL', status: 'COMPLETED' },
          { taskType: 'IT', status: 'COMPLETED' },
        ],
      }),
    });

    renderWithProviders(<Harness initialRequest={REQUEST_WITH_IT_PENDING} />, { identity: IT_USER });

    await user.click(screen.getByRole('button', { name: /complete/i }));

    await waitFor(() => expect(screen.getByTestId('it-task-status')).toHaveTextContent('COMPLETED'));
    expect(screen.getByTestId('status')).toHaveTextContent('COMPLETED');

    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/v1/transfer-requests/tr-1/tasks/IT/complete');
  });

  it('TC-F12: marking a task Not Required requires a comment and excludes it from pending', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...REQUEST_WITH_IT_PENDING,
        status: 'COMPLETED',
        tasks: [
          { taskType: 'ORG_UPDATE', status: 'COMPLETED' },
          { taskType: 'PAYROLL', status: 'COMPLETED' },
          { taskType: 'IT', status: 'NOT_REQUIRED' },
        ],
      }),
    });

    renderWithProviders(<Harness initialRequest={REQUEST_WITH_IT_PENDING} />, { identity: IT_USER });

    const notRequiredButton = screen.getByRole('button', { name: /not required/i });
    expect(notRequiredButton).toBeDisabled();

    await user.type(screen.getByLabelText(/comment/i), 'no access change needed');
    expect(notRequiredButton).toBeEnabled();
    await user.click(notRequiredButton);

    await waitFor(() => expect(screen.getByTestId('it-task-status')).toHaveTextContent('NOT_REQUIRED'));

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/v1/transfer-requests/tr-1/tasks/IT/not-required');
    expect(JSON.parse(options.body)).toEqual({ comment: 'no access change needed' });
  });

  it('shows nothing actionable for a role with no pending task on this request', () => {
    renderWithProviders(<Harness initialRequest={REQUEST_WITH_IT_PENDING} />, {
      identity: { userId: 'payroll-001', roles: ['PAYROLL'] },
    });

    expect(screen.queryByRole('button', { name: /complete/i })).not.toBeInTheDocument();
  });
});
