import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Target, LogOut } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout(); // ✅ token clear karega
    navigate("/login", { replace: true }); // ✅ force redirect to login
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-indigo-600 font-medium">Baseball Defensive Training</div>
              <div className="text-xl font-bold text-indigo-700">FieldIQ</div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-6">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link to="/features" className="text-gray-600 hover:text-gray-900 font-medium">Features</Link>
                <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium">About</Link>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
