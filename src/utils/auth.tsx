
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
    async function loadUser() {
      try {
        const { success, user } = await getCurrentUser();
        if (success && user) {
          setUser(user);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", { email }); // Debug log
      
      const { success, user, error } = await signIn(email, password);
      
      console.log("Login result:", { success, user, error }); // Debug log

      if (success && user) {
        setUser(user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
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
