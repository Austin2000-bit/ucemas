
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { User } from "@/types";
import { signIn, signOut, getCurrentUser } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  signOut?: () => Promise<void>; // Add signOut as alias for logout
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
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
    
    // Initialize demo users if they don't exist
    initializeDefaultUsers();
    
    setIsLoading(false);
  }, []);

  const initializeDefaultUsers = () => {
    // Check if users array exists in localStorage
    if (!localStorage.getItem("users")) {
      // Create demo users
      const demoUsers = [
        {
          id: "admin-id",
          first_name: "Admin",
          last_name: "User",
          email: "admin@example.com",
          password: "admin123",
          role: "admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "helper-id",
          first_name: "Amanda",
          last_name: "Helper",
          email: "amanda@example.com",
          password: "helper123",
          role: "helper",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "student-id",
          first_name: "John",
          last_name: "Student",
          email: "john@example.com",
          password: "student123",
          role: "student",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "driver-id",
          first_name: "Dave",
          last_name: "Driver",
          email: "driver@example.com",
          password: "driver123",
          role: "driver",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      localStorage.setItem("users", JSON.stringify(demoUsers));
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", { email }); // Debug log
      
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = users.find(
        (u: any) => u.email === email && u.password === password
      );

      console.log("Found user:", foundUser); // Debug log

      if (!foundUser) {
        console.log("No user found or password mismatch");
        return false;
      }
      
      // Remove password from user object before storing
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Store current user in localStorage
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);
      
      console.log("Login successful");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
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
