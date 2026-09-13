import { Link } from 'react-router-dom';
import { IdentitySwitcher } from '../modules/transfer-requests/components/IdentitySwitcher.jsx';
import './Layout.css';

// Header (with the persistently-visible IdentitySwitcher, AC-F15) + simple nav wrapped
// around every routed page.
export function Layout({ children }) {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__brand">
          Employee Internal Transfer
        </Link>
        <nav className="layout__nav">
          <Link to="/requests/new">New Request</Link>
          <Link to="/requests/mine">My Requests</Link>
          <Link to="/tasks">Task Queue</Link>
        </nav>
        <IdentitySwitcher />
      </header>
      <main className="layout__main">{children}</main>
    </div>
  );
}
