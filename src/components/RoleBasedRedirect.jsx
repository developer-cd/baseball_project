import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleBasedRedirect() {
  const { isAuthenticated, getDashboardRoute } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only redirect from root path, not from other valid routes
  if (location.pathname === '/') {
    const dashboardRoute = getDashboardRoute();
    return <Navigate to={dashboardRoute} replace />;
  }

  // For other paths, just redirect to home
  return <Navigate to="/home" replace />;
}
