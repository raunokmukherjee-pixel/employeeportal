// employee-transfer-webapp.TC-F06 (AC-F05), TC-F13/F14 (AC-F12/F13).
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils.jsx';
import { RequestDetail } from '@/modules/transfer-requests/components/RequestDetail.jsx';

const EMPLOYEE = { userId: 'emp-4471', roles: ['EMPLOYEE'] };

const SUBMITTED_DETAIL = {
  id: 'tr-1',
  status: 'SUBMITTED',
  employeeId: 'emp-4471',
  managerId: 'mgr-2210',
  proposedDepartmentId: 'dept-102',
  proposedLocationId: 'loc-blr-01',
  proposedRoleId: 'role-sse',
  effectiveDate: '2026-10-20',
  pendingWith: ['MANAGER'],
  tasks: [],
  timeline: [
    { stage: 'EMPLOYEE', decision: 'SUBMITTED', actorId: 'emp-4471', occurredAt: '2026-09-01T10:00:00Z' },
  ],
};

const IN_PROGRESS_DETAIL = {
  ...SUBMITTED_DETAIL,
  status: 'IN_PROGRESS',
  pendingWith: ['IT', 'FACILITIES'],
  tasks: [
    { taskType: 'ORG_UPDATE', status: 'COMPLETED' },
    { taskType: 'PAYROLL', status: 'COMPLETED' },
    { taskType: 'IT', status: 'PENDING' },
    { taskType: 'FACILITIES', status: 'PENDING' },
  ],
  timeline: [
    ...SUBMITTED_DETAIL.timeline,
    { stage: 'MANAGER', decision: 'APPROVED', actorId: 'mgr-2210', occurredAt: '2026-09-02T08:00:00Z' },
    { stage: 'HR', decision: 'APPROVED', actorId: 'hr-001', occurredAt: '2026-09-03T09:00:00Z', comment: 'Eligible' },
  ],
};

function mockFetchOnce(body, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status, json: async () => body });
}

describe('RequestDetail', () => {
  it('TC-F06: renders status, fields, pending-with, tasks and timeline from the GET response', async () => {
    mockFetchOnce(IN_PROGRESS_DETAIL);

    renderWithProviders(<RequestDetail requestId="tr-1" />, { identity: EMPLOYEE });

    await waitFor(() => expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument());
    expect(screen.getByText(/dept-102/)).toBeInTheDocument();
    expect(screen.getByText(/loc-blr-01/)).toBeInTheDocument();
    expect(screen.getByText(/role-sse/)).toBeInTheDocument();
    expect(screen.getByText(/2026-10-20/)).toBeInTheDocument();
    expect(screen.getByText(/IT, FACILITIES/)).toBeInTheDocument();
    expect(screen.getByText(/ORG_UPDATE/)).toBeInTheDocument();
    expect(screen.getByText(/mgr-2210/)).toBeInTheDocument();
    expect(screen.getByText(/Eligible/)).toBeInTheDocument();
  });

  it('TC-F13: owner can cancel a SUBMITTED request; it becomes CANCELLED with no further actions', async () => {
    const user = userEvent.setup();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => SUBMITTED_DETAIL })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...SUBMITTED_DETAIL, status: 'CANCELLED' }),
      });

    renderWithProviders(<RequestDetail requestId="tr-1" />, { identity: EMPLOYEE });

    await waitFor(() => expect(screen.getByText('SUBMITTED')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.getByText('CANCELLED')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();

    const [url, options] = global.fetch.mock.calls[1];
    expect(url).toBe('/api/v1/transfer-requests/tr-1/cancel');
    expect(options.method).toBe('POST');
  });

  it('TC-F14: Cancel is not offered once the request is PENDING_HR_VALIDATION or later', async () => {
    mockFetchOnce({ ...SUBMITTED_DETAIL, status: 'PENDING_HR_VALIDATION', pendingWith: ['HR'] });

    renderWithProviders(<RequestDetail requestId="tr-1" />, { identity: EMPLOYEE });

    await waitFor(() => expect(screen.getByText('PENDING_HR_VALIDATION')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('AC-F14: a 403 from the backend renders a not-permitted state, not a crash', async () => {
    mockFetchOnce(
      { error: { code: 'FORBIDDEN', message: 'requires ownership or assignment' } },
      false,
      403
    );

    renderWithProviders(<RequestDetail requestId="tr-1" />, { identity: EMPLOYEE });

    expect(await screen.findByText(/do not have permission/i)).toBeInTheDocument();
  });
});
