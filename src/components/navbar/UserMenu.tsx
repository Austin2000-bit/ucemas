
import * as React from "react";
import { Link } from "react-router-dom";
import { User } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserMenuProps {
  user: User | null;
  handleLogout: () => void;
  hideLinks?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, handleLogout, hideLinks = false }) => {
  return (
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
  );
};

export default UserMenu;
