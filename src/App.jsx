import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Ground from "./pages/Ground";
import BrowseSituation from "./pages/BrowseSituation";
import AdminDashboard from "./pages/AdminDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import GuestRoute from "./components/GuestRoute";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

function AppWrapper() {
  const location = useLocation();

  // login aur register par navbar hide
  const hideNavbar = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Guest only routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ground"
          element={
            <ProtectedRoute>
              <Ground />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <BrowseSituation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleBasedRoute allowedRoles={['admin']} fallbackRoute="/">
              <AdminDashboard />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/coach"
          element={
            <RoleBasedRoute allowedRoles={['coach']} fallbackRoute="/">
              <CoachDashboard />
            </RoleBasedRoute>
          }
        />

        {/* Root route - redirects to appropriate dashboard based on role */}
        <Route
          path="/"
          element={<RoleBasedRedirect />}
        />

        {/* Default route - only for truly unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/home" replace />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppWrapper />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
