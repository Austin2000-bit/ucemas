import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import AdminMessages from "@/components/AdminMessages"; // Ensure this file exists or update the path
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, MessageSquare, Menu, X } from "lucide-react";

type NavbarProps = {
  title?: string
}

const Navbar = ({ title = "USNMS" }: NavbarProps) => {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  // All nav links (role-based)
  const navLinks = user
    ? [
        ...(hasRole(["admin"]) ? [
          { to: "/register", label: "Register" },
          { to: "/admin", label: "Admin" },
        ] : []),
        ...(hasRole(["helper", "admin"]) ? [
          { to: "/helper", label: "Assistant" },
        ] : []),
        ...(hasRole(["student", "admin"]) ? [
          { to: "/student", label: "Student" },
        ] : []),
        { to: "/book-ride", label: "Book ride" },
        { to: "/complaint", label: "Complaint" },
      ]
    : [
        { to: "/register", label: "Register" },
        { to: "/login", label: "Login" },
      ];

  return (
    <>
      {/* Menu navigation */}
      <div className="bg-blue-500 dark:bg-blue-700 text-white relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger for mobile (left) - always show */}
            <button
              className="md:hidden p-2 focus:outline-none"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {/* Title (desktop only) */}
            <Link to="/" className="px-4 py-2 whitespace-nowrap font-poppins text-lg font-semibold hidden md:block">
              {title}
            </Link>
            {/* Desktop nav links */}
            {user && (
              <div className="hidden md:flex items-center justify-center space-x-2 overflow-x-auto">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-4 py-2 whitespace-nowrap font-poppins hover:bg-blue-600 dark:hover:bg-blue-800 rounded-md transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
            <div className="items-center space-x-2 hidden md:flex">
              {user ? (
                <>
                  <span className="text-sm">{user.first_name} {user.last_name}</span>
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
        {/* Mobile nav menu - only hamburger visible on mobile, menu overlays when open */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-600 dark:bg-blue-800 text-white w-full absolute left-0 z-50 shadow-lg">
            <div className="flex flex-col items-center py-4 space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 w-full text-center font-poppins hover:bg-blue-700 dark:hover:bg-blue-900 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col items-center w-full mt-2">
                {user ? (
                  <>
                    <span className="text-sm mb-2">{user.first_name} {user.last_name}</span>
                    {user.id && <AdminMessages userId={user.id} />}
                    <Link to="/messages" className="w-full">
                      <Button variant="ghost" size="sm" className="w-full text-white hover:bg-blue-700 dark:hover:bg-blue-900">
                        <MessageSquare className="h-5 w-5 mr-2" /> Messages
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleLogout}
                      className="w-full text-white hover:bg-blue-700 dark:hover:bg-blue-900 mt-2">
                      <LogOut size={18} className="mr-2" /> Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/login" className="w-full">
                    <Button variant="ghost" size="sm" className="w-full text-white hover:bg-blue-700 dark:hover:bg-blue-900">
                      Login
                    </Button>
                  </Link>
                )}
                <div className="mt-2"><ThemeToggle /></div>
              </div>
            </div>
          </div>
        )}
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
