import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { NotPermitted } from '../components/NotPermitted.jsx';
import { ROLES } from '../constants';

// The API contract (06-api-contract/API-Contract.md) has no "list requests pending my
// role" endpoint for PAYROLL/IT/FACILITIES (only EMPLOYEE gets `scope=mine`) — a request id
// is assumed to reach a downstream actor out-of-band (e.g. shared by the employee), same as
// Manager/HR reaching a request today. This page is that lookup entry point; the actual
// Complete/Not Required controls live on the request's own detail view (RequestDetail +
// TaskQueue), gated the same way there.
export function TaskQueuePage() {
  const { identity } = useAuth();
  const navigate = useNavigate();
  const [requestId, setRequestId] = useState('');

  if (
    !identity.roles.includes(ROLES.PAYROLL) &&
    !identity.roles.includes(ROLES.IT) &&
    !identity.roles.includes(ROLES.FACILITIES)
  ) {
    return (
      <NotPermitted message="Only a Payroll, IT, or Facilities identity has a downstream task queue." />
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (requestId.trim()) {
      navigate(`/requests/${requestId.trim()}`);
    }
  }

  return (
    <div>
      <h2>Task Queue</h2>
      <p>
        Open a request by id to see and act on your pending {identity.roles.join('/')} task.
      </p>
      <form onSubmit={handleSubmit} className="task-queue-lookup">
        <label htmlFor="task-queue-request-id">Request ID</label>
        <input
          id="task-queue-request-id"
          value={requestId}
          onChange={(event) => setRequestId(event.target.value)}
        />
        <button type="submit">Open</button>
      </form>
    </div>
  );
}
