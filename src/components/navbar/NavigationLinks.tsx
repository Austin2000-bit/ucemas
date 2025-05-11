
import * as React from "react";
import { Link } from "react-router-dom";
import { User } from "@/types";

interface NavigationLinksProps {
  user: User | null;
  hideLinks?: boolean;
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({ user, hideLinks = false }) => {
  if (hideLinks) return null;

  return (
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
  );
};

export default NavigationLinks;
