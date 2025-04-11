
import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Define our user types
type UserRole = "admin" | "helper" | "student" | null;

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demo
const USERS = [
  { 
    id: "admin", 
    name: "Admin User", 
    email: "admin@example.com", 
    password: "admin123", 
    role: "admin" as UserRole 
  },
  { 
    id: "john", 
    name: "John Smith", 
    email: "john@example.com", 
    password: "student123", 
    role: "student" as UserRole 
  },
  { 
    id: "amanda", 
    name: "Amanda Kusisqanya", 
    email: "amanda@example.com", 
    password: "helper123", 
    role: "helper" as UserRole 
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Check for existing user session in local storage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple authentication for demo purposes
    const foundUser = USERS.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

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
  const { isAuthenticated, hasRole } = useAuth();
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
    const { user } = useAuth();
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
      }
    }
    
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated && user) {
    // Redirect to appropriate page based on user role
    let redirectPath = "/login";
    
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
    }
    
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};
