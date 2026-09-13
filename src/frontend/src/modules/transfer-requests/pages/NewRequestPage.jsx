import { useAuth } from '../hooks/useAuth.jsx';
import { NewRequestForm } from '../components/NewRequestForm.jsx';
import { NotPermitted } from '../components/NotPermitted.jsx';
import { ROLES } from '../constants';

// AC-F14: a direct navigation to this screen with an identity that isn't EMPLOYEE renders
// a not-permitted state rather than a broken form.
export function NewRequestPage() {
  const { identity } = useAuth();

  if (!identity.roles.includes(ROLES.EMPLOYEE)) {
    return <NotPermitted message="Only an Employee identity can submit a transfer request." />;
  }

  return <NewRequestForm />;
}
