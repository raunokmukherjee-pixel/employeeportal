import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { listMyTransferRequests } from '../services/transferRequestsApi';
import './MyRequestsList.css';

// AC-F04: all of the employee's own requests (active and historical), newest first, each
// showing status and current "pending with". Sorted client-side by createdAt so the
// "newest first" guarantee doesn't silently depend on the backend's return order.
export function MyRequestsList() {
  const { token } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    listMyTransferRequests(token)
      .then((data) => {
        if (cancelled) return;
        const sorted = [...(data.items || [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setItems(sorted);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load your requests.');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <p role="alert" className="my-requests-list__error">
        {error}
      </p>
    );
  }

  if (items === null) {
    return <p>Loading your requests…</p>;
  }

  if (items.length === 0) {
    return <p>No transfer requests yet.</p>;
  }

  return (
    <ul className="my-requests-list">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={`/requests/${item.id}`}>{item.id}</Link>
          <span className="my-requests-list__status">{item.status}</span>
          <span className="my-requests-list__pending-with">
            {item.pendingWith && item.pendingWith.length > 0
              ? `Pending with: ${item.pendingWith.join(', ')}`
              : 'Nothing pending'}
          </span>
        </li>
      ))}
    </ul>
  );
}
