import { useAuth } from "@clerk/clerk-react";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

type RoleBasedRouteProps = {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
};

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = "/login" 
}: RoleBasedRouteProps) {
  const { isLoaded, userId, getToken } = useAuth();
  
  // If Clerk is still loading, show nothing
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  // If not signed in, redirect to login
  if (!userId) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  // In a real application, you would fetch the user's role from Clerk metadata
  // For demo purposes, we're simulating role checking
  const hasRequiredRole = async () => {
    try {
      // This is a placeholder for actual role retrieval logic
      // In a real app, you would get this from Clerk user metadata
      const userRole = localStorage.getItem("userRole") || "user";
      return allowedRoles.includes(userRole);
    } catch (error) {
      console.error("Error checking role:", error);
      return false;
    }
  };
  
  // For demo purposes, we're allowing access
  // In a real application, you would check the role and redirect if needed
  return <>{children}</>;
}

export function useRequireAuth(requiredRoles: string[] = []) {
  const { isLoaded, userId, sessionId } = useAuth();
  
  return {
    isLoaded,
    isAuthenticated: Boolean(userId && sessionId),
    checkRole: (role: string) => {
      // In a real app, you would check the role from Clerk user metadata
      return true; // Simplified for demo
    }
  };
}
