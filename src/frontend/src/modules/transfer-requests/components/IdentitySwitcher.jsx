import { useAuth } from '../hooks/useAuth.jsx';
import './IdentitySwitcher.css';

// Persistently-visible demo identity picker (spec AC-F15) — not a login feature, just lets
// the walkthrough switch between seeded actors without a page reload.
export function IdentitySwitcher() {
  const { identity, identities, setIdentity } = useAuth();

  function handleChange(event) {
    const next = identities.find((candidate) => candidate.userId === event.target.value);
    if (next) {
      setIdentity(next);
    }
  }

  return (
    <div className="identity-switcher">
      <label htmlFor="identity-select">Acting as</label>
      <select id="identity-select" value={identity.userId} onChange={handleChange}>
        {identities.map((candidate) => (
          <option key={candidate.userId} value={candidate.userId}>
            {candidate.label}
          </option>
        ))}
      </select>
      <span className="identity-switcher__roles">{identity.roles.join(', ')}</span>
    </div>
  );
}
