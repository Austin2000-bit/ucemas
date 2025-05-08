import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import AdminMessages from "@/components/AdminMessages"; // Ensure this file exists or update the path
import { useAuth } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare } from "lucide-react";

type NavbarProps = {
  title?: string
}

const Navbar = ({ title = "USNMS" }: NavbarProps) => {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  return (
    <>
      {/* Menu navigation */}
      <div className="bg-blue-500 dark:bg-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="px-4 py-2 whitespace-nowrap font-poppins text-lg font-semibold">
              {title}
            </Link>
            {user && (
              <div className="flex items-center justify-center space-x-2 overflow-x-auto">
                {/* Admin only links */}
                {hasRole(["admin"]) && (
                  <>
                    <Link to="/register" className="px-4 py-2 whitespace-nowrap font-poppins hover:bg-blue-600 dark:hover:bg-blue-800 rounded-md transition-colors">Register</Link>
                    <Link to="/admin" className="px-4 py-2 whitespace-nowrap font-poppins hover:bg-blue-600 dark:hover:bg-blue-800 rounded-md transition-colors">Admin</Link>
                    <Link to="/confirmation-logs" className="px-4 py-2 whitespace-nowrap font-poppins hover:bg-blue-600 dark:hover:bg-blue-800 rounded-md transition-colors">Logs</Link>
                  </>
                )}
                
                {/* Helper links */}
                {hasRole(["helper", "admin"]) && (
                  <Link to="/helper" className="px-4 py-2 whitespace-nowrap font-poppins hover:bg-blue-600 dark:hover:bg-blue-800 rounded-md transition-colors">Assistant</Link>
                )}
                
                {/* Student links */}
                {hasRole(["student", "admin"]) && (
                  <Link to="/student" className="px-4 py-2 whitespace-nowrap font-poppins hover:bg-blue-600 dark:hover:bg-blue-800 rounded-md transition-colors">Student</Link>
                )}
                
                {/* Shared links for authenticated users */}
                <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap font-poppins hover:bg-blue-600 dark:hover:bg-blue-800 rounded-md transition-colors">Book ride</Link>
                <Link to="/complaint" className="px-4 py-2 whitespace-nowrap font-poppins hover:bg-blue-600 dark:hover:bg-blue-800 rounded-md transition-colors">Complaint</Link>
              </div>
            )}
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  <span className="text-sm hidden md:inline-block">{user.first_name} {user.last_name}</span>
                  {user.id && <AdminMessages userId={user.id} />}
                  <Link to="/messages">
                    <Button variant="ghost" size="sm" className="relative text-white hover:bg-blue-600 dark:hover:bg-blue-800">
                      <MessageSquare className="h-5 w-5" />
                      <span className="sr-only">Messages</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    className="text-white hover:bg-blue-600 dark:hover:bg-blue-800">
                    <LogOut size={18} />
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-blue-600 dark:hover:bg-blue-800">
                    Login
                  </Button>
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      {/* Title bar (optional) */}
      {title !== "USNMS" && (
        <div className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-12">
              <div className="font-medium font-poppins">{title}</div>
              {user && (
                <div className="text-sm">
                  Logged in as <span className="font-medium">{user.role}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
