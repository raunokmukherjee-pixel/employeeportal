// AC-F14: mirrors the backend's 403 FORBIDDEN — rendered instead of a crash or a
// silently-succeeding action whenever the current identity isn't entitled to what a direct
// navigation/action targets.
export function NotPermitted({ message }) {
  return (
    <p role="alert" className="not-permitted">
      {message || 'You do not have permission to view or act on this.'}
    </p>
  );
}
