import { useAuth } from '../hooks/useAuth.jsx';
import { MyRequestsList } from '../components/MyRequestsList.jsx';
import { NotPermitted } from '../components/NotPermitted.jsx';
import { ROLES } from '../constants';

export function MyRequestsPage() {
  const { identity } = useAuth();

  if (!identity.roles.includes(ROLES.EMPLOYEE)) {
    return <NotPermitted message="Only an Employee identity has its own requests to list." />;
  }

  return (
    <>
      <h2>My Requests</h2>
      <MyRequestsList />
    </>
  );
}
