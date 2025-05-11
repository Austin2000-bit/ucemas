
import * as React from "react";
import { Link } from "react-router-dom";
import { User } from "@/types";

interface MobileMenuProps {
  isOpen: boolean;
  user: User | null;
  handleLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, user, handleLogout }) => {
  if (!isOpen) return null;
  
  return (
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
  );
};

export default MobileMenu;
