
import { ReactNode, createContext, useContext, useState, useEffect, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { SystemLogs } from "@/utils/systemLogs";
import { User, UserRole } from "@/lib/supabase";
import { signIn, signOut, getCurrentUser } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { success, user: currentUser } = await getCurrentUser();
        if (success && currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { success, user: loggedInUser, error } = await signIn(email, password);

      if (success && loggedInUser) {
        setUser(loggedInUser);
        
        // Log the login
        SystemLogs.addLog(
          "User Login",
          `User ${loggedInUser.first_name} ${loggedInUser.last_name} logged in`,
          loggedInUser.id,
          loggedInUser.role
        );
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${loggedInUser.first_name}!`,
        });
        
        return true;
      }
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { success, error } = await signOut();
      
      if (success) {
        if (user) {
          SystemLogs.addLog(
            "User Logout",
            `User ${user.first_name} ${user.last_name} logged out`,
            user.id,
            user.role
          );
        }
        setUser(null);
      } else if (error) {
        toast({
          title: "Logout Error",
          description: error.message || "Failed to log out.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Error",
        description: "An error occurred during logout.",
        variant: "destructive",
      });
    }
  }, [user]);

  const hasRole = useCallback((roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Protected route component
type ProtectedRouteProps = {
  children: ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
};

export const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  redirectTo = "/login" 
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole, user } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    toast({
      title: "Access Denied",
      description: "You don't have permission to access this page.",
      variant: "destructive",
    });
    
    // Redirect to appropriate page based on role
    let redirectPath = "/login";
    
    if (user) {
      switch(user.role) {
        case "admin":
          redirectPath = "/admin";
          break;
        case "helper":
          redirectPath = "/helper";
          break;
        case "student":
          redirectPath = "/student";
          break;
        case "driver":
          redirectPath = "/driver";
          break;
        default:
          redirectPath = "/login";
      }
    }
    
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  // If authenticated, redirect based on role
  if (isAuthenticated && user) {
    switch(user.role) {
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
  
  // If not authenticated, show the children (login page)
  return <>{children}</>;
};
