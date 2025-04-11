
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import AdminMessages from "@/components/AdminMessages"; // Ensure this file exists or update the path
import { useAuth } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
          <div className="flex items-center justify-between h-12">
            <Link to="/" className="px-4 py-2 whitespace-nowrap font-poppins">USNMS</Link>
            <div className="flex items-center justify-center space-x-2 overflow-x-auto">
              {/* Admin only links */}
              {hasRole(["admin"]) && (
                <>
                  <Link to="/register" className="px-4 py-2 whitespace-nowrap font-poppins">Register</Link>
                  <Link to="/admin" className="px-4 py-2 whitespace-nowrap font-poppins">Admin</Link>
                  <Link to="/confirmation-logs" className="px-4 py-2 whitespace-nowrap font-poppins">Logs</Link>
                </>
              )}
              
              {/* Helper links */}
              {hasRole(["helper", "admin"]) && (
                <Link to="/helper" className="px-4 py-2 whitespace-nowrap font-poppins">Helper</Link>
              )}
              
              {/* Student links */}
              {hasRole(["student", "admin"]) && (
                <Link to="/student" className="px-4 py-2 whitespace-nowrap font-poppins">Student</Link>
              )}
              
              {/* Shared links for authenticated users */}
              {user && (
                <>
                  <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap font-poppins">Book ride</Link>
                  <Link to="/complaint" className="px-4 py-2 whitespace-nowrap font-poppins">Complaint</Link>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {user && (
                <>
                  <span className="text-sm hidden md:inline-block">{user.name}</span>
                  {user.id && <AdminMessages userId={user.id} />}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    className="text-white">
                    <LogOut size={18} />
                  </Button>
                </>
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
