import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { getTransferRequest, cancelTransferRequest } from '../services/transferRequestsApi';
import { ROLES, STATUS } from '../constants';
import { ManagerDecisionPanel } from './ManagerDecisionPanel.jsx';
import { HrDecisionPanel } from './HrDecisionPanel.jsx';
import { TaskQueue } from './TaskQueue.jsx';
import { NotPermitted } from './NotPermitted.jsx';
import './RequestDetail.css';

// AC-F05: status, all proposed fields, "pending with", the downstream task list, and the
// full decision timeline for any entitled viewer (owner, assigned manager/HR, or an
// assigned downstream actor). Also hosts the Cancel action (AC-F12/F13) and embeds the
// role-gated decision panels / task queue (AC-F06-F11) so one screen covers a request's
// whole lifecycle.
export function RequestDetail({ requestId }) {
  const { identity, token } = useAuth();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    setError(null);
    getTransferRequest(requestId, token)
      .then(setRequest)
      .catch((err) => {
        if (err.status === 403) {
          setError({ status: 403, message: 'You do not have permission to view this request.' });
        } else if (err.status === 404) {
          setError({ status: 404, message: 'Request not found.' });
        } else {
          setError({ status: err.status, message: err.message || 'Failed to load this request.' });
        }
      });
  }, [requestId, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancel() {
    setCancelling(true);
    try {
      const updated = await cancelTransferRequest(requestId, token);
      setRequest(updated);
    } catch (err) {
      setError({ status: err.status, message: err.message || 'Could not cancel this request.' });
    } finally {
      setCancelling(false);
    }
  }

  if (error) {
    return error.status === 403 ? (
      <NotPermitted message={error.message} />
    ) : (
      <p role="alert">{error.message}</p>
    );
  }

  if (!request) {
    return <p>Loading request…</p>;
  }

  const isOwner = identity.userId === request.employeeId;
  const canCancel = isOwner && request.status === STATUS.SUBMITTED;

  return (
    <div className="request-detail">
      <h2>Request {request.id}</h2>
      <dl className="request-detail__fields">
        <dt>Status</dt>
        <dd>{request.status}</dd>
        <dt>Department</dt>
        <dd>{request.proposedDepartmentId}</dd>
        <dt>Location</dt>
        <dd>{request.proposedLocationId}</dd>
        <dt>Role</dt>
        <dd>{request.proposedRoleId}</dd>
        <dt>Effective date</dt>
        <dd>{request.effectiveDate}</dd>
        {request.reason && (
          <>
            <dt>Reason</dt>
            <dd>{request.reason}</dd>
          </>
        )}
        <dt>Pending with</dt>
        <dd>
          {request.pendingWith && request.pendingWith.length > 0
            ? request.pendingWith.join(', ')
            : 'Nothing pending'}
        </dd>
      </dl>

      <section>
        <h3>Downstream tasks</h3>
        {request.tasks && request.tasks.length > 0 ? (
          <ul className="request-detail__tasks">
            {request.tasks.map((task) => (
              <li key={task.taskType}>
                {task.taskType}: {task.status}
              </li>
            ))}
          </ul>
        ) : (
          <p>No downstream tasks yet.</p>
        )}
      </section>

      <section>
        <h3>Timeline</h3>
        <ul className="request-detail__timeline">
          {(request.timeline || []).map((entry, index) => (
            <li key={index}>
              <strong>{entry.stage}</strong> {entry.decision} by {entry.actorId} on{' '}
              {entry.occurredAt}
              {entry.comment ? ` — "${entry.comment}"` : ''}
            </li>
          ))}
        </ul>
      </section>

      {canCancel && (
        <button type="button" disabled={cancelling} onClick={handleCancel}>
          {cancelling ? 'Cancelling…' : 'Cancel Request'}
        </button>
      )}

      <ManagerDecisionPanel request={request} onDecided={setRequest} />
      <HrDecisionPanel request={request} onDecided={setRequest} />
      {(identity.roles.includes(ROLES.PAYROLL) ||
        identity.roles.includes(ROLES.IT) ||
        identity.roles.includes(ROLES.FACILITIES)) && (
        <TaskQueue request={request} onUpdated={setRequest} />
      )}
    </div>
  );
}
