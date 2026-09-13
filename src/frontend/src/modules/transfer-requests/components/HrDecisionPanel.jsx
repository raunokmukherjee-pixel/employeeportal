import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { submitHrDecision } from '../services/transferRequestsApi';
import { ROLES, STATUS } from '../constants';
import './DecisionPanel.css';

// AC-F08/F09. Any HR-role identity may act (the contract assigns this by role, not a
// specific HR user), only while the request is PENDING_HR_VALIDATION.
export function HrDecisionPanel({ request, onDecided }) {
  const { identity, token } = useAuth();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isHr = identity.roles.includes(ROLES.HR);

  if (!isHr || request.status !== STATUS.PENDING_HR_VALIDATION) {
    return null;
  }

  async function decide(decision) {
    setSubmitting(true);
    setError(null);
    try {
      const body = decision === 'REJECTED' ? { decision, comment } : { decision };
      const updated = await submitHrDecision(request.id, body, token);
      onDecided(updated);
    } catch (err) {
      setError(err.message || 'Could not submit the decision.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="decision-panel">
      <h3>HR Decision</h3>
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
          <label htmlFor="hr-reject-comment">Comment (required to reject)</label>
          <textarea
            id="hr-reject-comment"
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
