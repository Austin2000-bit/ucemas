
import * as React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/utils/auth";
import { User } from "@/types";

interface NavbarProps {
  title?: string;
  hideLinks?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ title = "UDSNMS", hideLinks = false }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    if (logout) {
      logout();
    }
  };

  return (
    <nav className="bg-blue-500 shadow dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <span className="text-white font-bold text-lg">
                {title || "UDSNMS"}
              </span>
            </div>

            {!hideLinks && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {!user && (
                  <>
                    <Link
                      to="/"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Home
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Login
                    </Link>
                  </>
                )}

                {user?.role === "admin" && (
                  <>
                    <Link
                      to="/admin"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Dashboard
                    </Link>
                  </>
                )}

                {user?.role === "student" && (
                  <>
                    <Link
                      to="/student"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/ride-booking"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Book Ride
                    </Link>
                    <Link
                      to="/complaints"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Submit Complaint
                    </Link>
                    <Link
                      to="/messages"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Messages
                    </Link>
                  </>
                )}

                {user?.role === "helper" && (
                  <>
                    <Link
                      to="/helper"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/messages"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Messages
                    </Link>
                    <Link
                      to="/confirmation-logs"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Confirmation Logs
                    </Link>
                  </>
                )}

                {user?.role === "driver" && (
                  <>
                    <Link
                      to="/driver"
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white hover:border-white hover:text-gray-100"
                    >
                      Dashboard
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="text-white mr-2">
                    {user.first_name} {user.last_name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm text-blue-500 bg-white hover:bg-gray-100 rounded"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              !hideLinks && (
                <Link
                  to="/login"
                  className="px-3 py-1 text-sm text-blue-500 bg-white hover:bg-gray-100 rounded"
                >
                  Login
                </Link>
              )
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-300 hover:bg-blue-600"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden bg-blue-600">
          <div className="pt-2 pb-3 space-y-1">
            {!user && (
              <>
                <Link
                  to="/"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Login
                </Link>
              </>
            )}

            {user?.role === "admin" && (
              <>
                <Link
                  to="/admin"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Dashboard
                </Link>
              </>
            )}

            {user?.role === "student" && (
              <>
                <Link
                  to="/student"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Dashboard
                </Link>
                <Link
                  to="/ride-booking"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Book Ride
                </Link>
                <Link
                  to="/complaints"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Submit Complaint
                </Link>
                <Link
                  to="/messages"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Messages
                </Link>
              </>
            )}

            {user?.role === "helper" && (
              <>
                <Link
                  to="/helper"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Dashboard
                </Link>
                <Link
                  to="/messages"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Messages
                </Link>
                <Link
                  to="/confirmation-logs"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
                >
                  Confirmation Logs
                </Link>
              </>
            )}

            {user?.role === "driver" && (
              <Link
                to="/driver"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-blue-700 hover:border-white"
              >
                Dashboard
              </Link>
            )}

            {user && (
              <div className="pt-4 pb-3 border-t border-blue-700">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center">
                      <span className="text-white">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm font-medium text-blue-200">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-white hover:bg-blue-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
