// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    console.log('AuthContext - useEffect - token:', !!token, 'storedUser:', !!storedUser);
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('AuthContext - Setting authenticated user:', userData);
        setIsAuthenticated(true);
        setUser(userData);
      } catch (error) {
        console.error('AuthContext - Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    } else {
      console.log('AuthContext - No valid token or user data found');
    }
    
    // Set loading to false after checking authentication
    setIsLoading(false);
  }, []);

  const login = (userData, token, refreshToken) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    
    // Return the dashboard route based on the user data
    return getDashboardRoute(userData);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Role-based helper functions
  const getUserRole = () => {
    return user?.role || null;
  };

  const isAdmin = () => {
    return user?.role?.toString()?.toLowerCase()?.trim() === 'admin';
  };

  const isCoach = () => {
    return user?.role?.toString()?.toLowerCase()?.trim() === 'coach';
  };

  const isUser = () => {
    return user?.role?.toString()?.toLowerCase()?.trim() === 'user';
  };

  const hasRole = (role) => {
    return user?.role?.toString()?.toLowerCase()?.trim() === role?.toString()?.toLowerCase()?.trim();
  };

  const getDashboardRoute = (userData = null) => {
    const role = (userData?.role || getUserRole())?.toString()?.toLowerCase()?.trim();
    
    switch (role) {
      case 'admin':
        return '/admin';
      case 'coach':
        return '/coach';
      case 'user':
        return '/home';
      default:
        return '/home';
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        setUser, 
        isAuthenticated, 
        isLoading,
        login, 
        logout,
        getUserRole,
        isAdmin,
        isCoach,
        isUser,
        hasRole,
        getDashboardRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
