// employee-transfer-webapp.TC-F05 (AC-F04).
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../testUtils.jsx';
import { MyRequestsList } from '@/modules/transfer-requests/components/MyRequestsList.jsx';

const EMPLOYEE = { userId: 'emp-4471', roles: ['EMPLOYEE'] };

describe('MyRequestsList', () => {
  it('TC-F05: lists all of the employee\'s requests, newest first, with status and pending-with', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            id: 'tr-older',
            status: 'COMPLETED',
            pendingWith: [],
            createdAt: '2026-08-01T10:00:00Z',
          },
          {
            id: 'tr-newer',
            status: 'SUBMITTED',
            pendingWith: ['MANAGER'],
            createdAt: '2026-09-05T10:00:00Z',
          },
        ],
      }),
    });

    renderWithProviders(<MyRequestsList />, { identity: EMPLOYEE });

    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));

    const items = screen.getAllByRole('listitem');
    // newest first: tr-newer (2026-09-05) before tr-older (2026-08-01)
    expect(items[0]).toHaveTextContent('tr-newer');
    expect(items[0]).toHaveTextContent('SUBMITTED');
    expect(items[0]).toHaveTextContent('MANAGER');
    expect(items[1]).toHaveTextContent('tr-older');
    expect(items[1]).toHaveTextContent('COMPLETED');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/transfer-requests?scope=mine',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Bearer /) }) })
    );
  });

  it('shows an empty state with no requests', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    });

    renderWithProviders(<MyRequestsList />, { identity: EMPLOYEE });

    expect(await screen.findByText(/no transfer requests/i)).toBeInTheDocument();
  });
});
