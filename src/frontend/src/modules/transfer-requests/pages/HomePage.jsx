import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { ROLES } from '../constants';

export function HomePage() {
  const { identity } = useAuth();

  return (
    <div>
      <h2>Employee Internal Transfer</h2>
      <p>Pick an action for the identity currently selected above.</p>
      <ul>
        {identity.roles.includes(ROLES.EMPLOYEE) && (
          <>
            <li>
              <Link to="/requests/new">Submit a new transfer request</Link>
            </li>
            <li>
              <Link to="/requests/mine">View my requests</Link>
            </li>
          </>
        )}
        {(identity.roles.includes(ROLES.PAYROLL) ||
          identity.roles.includes(ROLES.IT) ||
          identity.roles.includes(ROLES.FACILITIES)) && (
          <li>
            <Link to="/tasks">Open my task queue</Link>
          </li>
        )}
        {(identity.roles.includes(ROLES.MANAGER) || identity.roles.includes(ROLES.HR)) && (
          <li>Open a request you were sent by its id (e.g. /requests/&lt;id&gt;) to decide on it.</li>
        )}
      </ul>
    </div>
  );
}
