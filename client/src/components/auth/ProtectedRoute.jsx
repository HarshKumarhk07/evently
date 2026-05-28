import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageLoader } from '../ui/Spinner.jsx';

/**
 * Gates a route behind authentication, optionally a specific role.
 * Redirects to /login, preserving the intended destination.
 *
 *   adminOnly   – only the admin role passes
 *   managerOnly – only manager *or* admin roles pass (admins can view
 *                 manager surfaces for support reasons)
 */
export default function ProtectedRoute({
  children,
  adminOnly = false,
  managerOnly = false,
}) {
  const { isAuthenticated, isAdmin, isManager, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (managerOnly && !isManager && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
