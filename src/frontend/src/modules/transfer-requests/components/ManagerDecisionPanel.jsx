import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { submitManagerDecision } from '../services/transferRequestsApi';
import { ROLES, STATUS } from '../constants';
import './DecisionPanel.css';

// AC-F06/F07. Renders nothing (never a broken/crashing control) unless the current
// identity is the MANAGER role assigned to this exact request, and the request is still
// in SUBMITTED — the backend's own role+ownership+state checks stay authoritative either
// way (spec NFR-02), this is just for a clean UI.
export function ManagerDecisionPanel({ request, onDecided }) {
  const { identity, token } = useAuth();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isAssignedManager =
    identity.roles.includes(ROLES.MANAGER) && identity.userId === request.managerId;

  if (!isAssignedManager || request.status !== STATUS.SUBMITTED) {
    return null;
  }

  async function decide(decision) {
    setSubmitting(true);
    setError(null);
    try {
      const body = decision === 'REJECTED' ? { decision, comment } : { decision };
      const updated = await submitManagerDecision(request.id, body, token);
      onDecided(updated);
    } catch (err) {
      setError(err.message || 'Could not submit the decision.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="decision-panel">
      <h3>Manager Decision</h3>
      {error && (
        <p role="alert" className="decision-panel__error">
          {error}
        </p>
      )}
      <div className="decision-panel__actions">
        <button type="button" disabled={submitting} onClick={() => decide('APPROVED')}>
          Approve
        </button>
        <div className="decision-panel__reject">
          <label htmlFor="manager-reject-comment">Comment (required to reject)</label>
          <textarea
            id="manager-reject-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <button
            type="button"
            disabled={submitting || comment.trim().length === 0}
            onClick={() => decide('REJECTED')}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
