
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  signOut?: () => Promise<void>; // Add signOut as alias for logout
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => ({ success: false, message: "AuthContext not initialized" }),
  logout: async () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("currentUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = users.find(
        (u: User) => u.email === email
      );

      if (!foundUser) {
        return { success: false, message: "User not found" };
      }
      
      // For demo purposes, assume the password is valid
      // In a real app, you would compare hashed passwords
      
      // Store current user in localStorage
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      setUser(foundUser);
      
      return { success: true, message: "Login successful" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An error occurred during login" };
    }
  };

  const logout = async () => {
    // Remove user from localStorage
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    signOut: logout, // Add signOut as alias for logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    // Redirect based on role
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "helper":
        return <Navigate to="/helper" replace />;
      case "student":
        return <Navigate to="/student" replace />;
      case "driver":
        return <Navigate to="/driver" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }
  
  return <>{children}</>;
};

interface PublicRouteProps {
  children: ReactNode;
}

export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (user) {
    // Redirect based on role
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "helper":
        return <Navigate to="/helper" replace />;
      case "student":
        return <Navigate to="/student" replace />;
      case "driver":
        return <Navigate to="/driver" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};
