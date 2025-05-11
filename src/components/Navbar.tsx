
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/utils/auth";

import NavigationLinks from "./navbar/NavigationLinks";
import UserMenu from "./navbar/UserMenu";
import MobileMenuToggle from "./navbar/MobileMenuToggle";
import MobileMenu from "./navbar/MobileMenu";

interface NavbarProps {
  title?: string;
  hideLinks?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ title = "UDSNMS", hideLinks = false }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) {
      logout();
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-500 shadow dark:bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/" className="text-white font-bold text-lg">
                {title || "UDSNMS"}
              </Link>
            </div>

            <NavigationLinks user={user} hideLinks={hideLinks} />
          </div>

          <UserMenu user={user} handleLogout={handleLogout} hideLinks={hideLinks} />
          <MobileMenuToggle isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
        </div>
      </div>

      <MobileMenu isOpen={isMenuOpen} user={user} handleLogout={handleLogout} />
    </nav>
  );
};

export default Navbar;
