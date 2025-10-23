import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleBasedRoute({ children, allowedRoles, fallbackRoute = "/home" }) {
  const { isAuthenticated, hasRole } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have required role, redirect to their dashboard
  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}
