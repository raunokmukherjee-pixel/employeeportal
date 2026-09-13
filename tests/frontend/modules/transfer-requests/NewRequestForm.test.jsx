// employee-transfer-webapp.TC-F02/F03/F04 (AC-F01/F02/F03).
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils.jsx';
import { NewRequestForm } from '@/modules/transfer-requests/components/NewRequestForm.jsx';

const EMPLOYEE = { userId: 'emp-4471', roles: ['EMPLOYEE'] };

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

async function fillValidForm(user) {
  await user.type(screen.getByLabelText(/department id/i), 'dept-102');
  await user.type(screen.getByLabelText(/location id/i), 'loc-blr-01');
  await user.type(screen.getByLabelText(/role id/i), 'role-sse');
  await user.type(screen.getByLabelText(/effective date/i), '2026-10-20');
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('NewRequestForm', () => {
  it('TC-F02: submits once with an Idempotency-Key header and navigates to the created request', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'tr-1',
        status: 'SUBMITTED',
        employeeId: 'emp-4471',
      }),
    });

    renderWithProviders(<NewRequestForm />, { identity: EMPLOYEE });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/requests/tr-1'));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/v1/transfer-requests');
    expect(options.method).toBe('POST');
    expect(options.headers['Idempotency-Key']).toEqual(expect.any(String));
    expect(options.headers['Idempotency-Key'].length).toBeGreaterThan(0);
    expect(options.headers.Authorization).toMatch(/^Bearer /);
  });

  it('TC-F03: renders inline field errors on 400 VALIDATION_ERROR and keeps entered values', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'effectiveDate must be at least 14 days from today',
          details: [{ field: 'effectiveDate', message: 'must be at least 14 days from today' }],
        },
      }),
    });

    renderWithProviders(<NewRequestForm />, { identity: EMPLOYEE });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/at least 14 days from today/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/department id/i)).toHaveValue('dept-102');
    expect(screen.getByLabelText(/effective date/i)).toHaveValue('2026-10-20');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('TC-F04: reuses the same Idempotency-Key across a double-click before the first response returns', async () => {
    const user = userEvent.setup();
    let resolveFirst;
    const pending = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    global.fetch = jest.fn().mockReturnValue(pending);

    renderWithProviders(<NewRequestForm />, { identity: EMPLOYEE });
    await fillValidForm(user);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    // Second click fires before the first response resolves.
    await user.click(submitButton);

    resolveFirst({
      ok: true,
      status: 201,
      json: async () => ({ id: 'tr-2', status: 'SUBMITTED', employeeId: 'emp-4471' }),
    });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());

    const keysUsed = global.fetch.mock.calls.map(([, options]) => options.headers['Idempotency-Key']);
    const distinctKeys = new Set(keysUsed);
    expect(distinctKeys.size).toBe(1);
  });
});
