import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { createTransferRequest, generateIdempotencyKey } from '../services/transferRequestsApi';
import './NewRequestForm.css';

const EMPTY_FORM = {
  proposedDepartmentId: '',
  proposedLocationId: '',
  proposedRoleId: '',
  effectiveDate: '',
  reason: '',
};

// AC-F01/F02/F03. No master-data listing endpoint exists in the API contract (only the
// 8 transfer-request endpoints), so department/location/role are entered as the raw ids
// the backend validates against (e.g. "dept-102") rather than a dropdown fed by a
// nonexistent list endpoint — see report for this judgment call.
export function NewRequestForm() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // AC-F03: reuse the same key across a retried submission that fires before the first
    // response returns; only cleared once a submission actually settles.
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = generateIdempotencyKey();
    }

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      proposedDepartmentId: form.proposedDepartmentId,
      proposedLocationId: form.proposedLocationId,
      proposedRoleId: form.proposedRoleId,
      effectiveDate: form.effectiveDate,
      ...(form.reason ? { reason: form.reason } : {}),
    };

    try {
      const created = await createTransferRequest(payload, token, idempotencyKeyRef.current);
      idempotencyKeyRef.current = null;
      setSubmitting(false);
      navigate(`/requests/${created.id}`);
    } catch (err) {
      idempotencyKeyRef.current = null;
      setSubmitting(false);

      if (err.status === 400 && Array.isArray(err.details) && err.details.length > 0) {
        const nextFieldErrors = {};
        const nonFieldMessages = [];
        err.details.forEach((detail) => {
          if (detail.field) {
            nextFieldErrors[detail.field] = detail.message || err.message;
          } else if (detail.message) {
            // Some validation errors (e.g. "proposed placement is identical to current
            // placement") aren't tied to a single field — surface these in the form-level
            // banner instead of discarding them.
            nonFieldMessages.push(detail.message);
          }
        });
        setFieldErrors(nextFieldErrors);
        // Form is not cleared (AC-F02) — `form` state is untouched above.
        if (nonFieldMessages.length > 0) {
          setFormError(nonFieldMessages.join(' '));
        } else if (Object.keys(nextFieldErrors).length === 0) {
          setFormError(err.message);
        }
      } else {
        setFormError(err.message || 'Something went wrong. Please try again.');
      }
    }
  }

  return (
    <form className="new-request-form" onSubmit={handleSubmit} noValidate>
      <h2>New Transfer Request</h2>

      {formError && (
        <p role="alert" className="form-error">
          {formError}
        </p>
      )}

      <div className="form-field">
        <label htmlFor="proposedDepartmentId">Department ID</label>
        <input
          id="proposedDepartmentId"
          name="proposedDepartmentId"
          value={form.proposedDepartmentId}
          onChange={handleChange}
        />
        {fieldErrors.proposedDepartmentId && (
          <p className="field-error">{fieldErrors.proposedDepartmentId}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="proposedLocationId">Location ID</label>
        <input
          id="proposedLocationId"
          name="proposedLocationId"
          value={form.proposedLocationId}
          onChange={handleChange}
        />
        {fieldErrors.proposedLocationId && (
          <p className="field-error">{fieldErrors.proposedLocationId}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="proposedRoleId">Role ID</label>
        <input
          id="proposedRoleId"
          name="proposedRoleId"
          value={form.proposedRoleId}
          onChange={handleChange}
        />
        {fieldErrors.proposedRoleId && <p className="field-error">{fieldErrors.proposedRoleId}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="effectiveDate">Effective Date</label>
        <input
          id="effectiveDate"
          name="effectiveDate"
          type="date"
          value={form.effectiveDate}
          onChange={handleChange}
        />
        {fieldErrors.effectiveDate && <p className="field-error">{fieldErrors.effectiveDate}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="reason">Reason (optional)</label>
        <textarea id="reason" name="reason" maxLength={1000} value={form.reason} onChange={handleChange} />
        {fieldErrors.reason && <p className="field-error">{fieldErrors.reason}</p>}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}
