import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
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

  // login par navbar hide
  const hideNavbar = ["/login"].includes(location.pathname);

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-blue-50/30">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Creation Restricted</h2>
                <p className="text-gray-600 mb-6">
                  User accounts can only be created by administrators. Please contact your system administrator to get an account.
                </p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            </div>
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
