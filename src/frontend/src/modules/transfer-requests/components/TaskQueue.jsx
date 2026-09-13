import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { completeTask, markTaskNotRequired } from '../services/transferRequestsApi';
import { DOWNSTREAM_TASK_TYPES, TASK_STATUS } from '../constants';
import './TaskQueue.css';

// AC-F10/F11: the actionable subset (Complete / Not Required) of a request's downstream
// tasks for the current PAYROLL/IT/FACILITIES identity. Only a task whose type matches one
// of the identity's roles and is still PENDING is offered — nothing renders otherwise.
export function TaskQueue({ request, onUpdated }) {
  const { identity, token } = useAuth();

  const actionableTasks = (request.tasks || []).filter(
    (task) =>
      DOWNSTREAM_TASK_TYPES.includes(task.taskType) &&
      identity.roles.includes(task.taskType) &&
      task.status === TASK_STATUS.PENDING
  );

  if (actionableTasks.length === 0) {
    return null;
  }

  return (
    <div className="task-queue">
      {actionableTasks.map((task) => (
        <TaskRow key={task.taskType} task={task} request={request} token={token} onUpdated={onUpdated} />
      ))}
    </div>
  );
}

function TaskRow({ task, request, token, onUpdated }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleComplete() {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await completeTask(request.id, task.taskType, token);
      onUpdated(updated);
    } catch (err) {
      setError(err.message || 'Could not complete the task.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNotRequired() {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await markTaskNotRequired(request.id, task.taskType, { comment }, token);
      onUpdated(updated);
    } catch (err) {
      setError(err.message || 'Could not update the task.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="task-queue__row">
      <h3>{task.taskType} task</h3>
      {error && (
        <p role="alert" className="task-queue__error">
          {error}
        </p>
      )}
      <button type="button" disabled={submitting} onClick={handleComplete}>
        Complete
      </button>
      <div className="task-queue__not-required">
        <label htmlFor={`not-required-comment-${task.taskType}`}>Comment (required)</label>
        <textarea
          id={`not-required-comment-${task.taskType}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <button
          type="button"
          disabled={submitting || comment.trim().length === 0}
          onClick={handleNotRequired}
        >
          Not Required
        </button>
      </div>
    </div>
  );
}
