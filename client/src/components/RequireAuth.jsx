import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function RequireAuth({ children, roles }) {
  const { isAuthed, role } = useAuth();
  const location = useLocation();

  if (!isAuthed) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && roles.length > 0 && !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}
