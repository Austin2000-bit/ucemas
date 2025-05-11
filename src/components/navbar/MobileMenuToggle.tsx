
import * as React from "react";

interface MobileMenuToggleProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const MobileMenuToggle: React.FC<MobileMenuToggleProps> = ({ isMenuOpen, toggleMenu }) => {
  return (
    <div className="-mr-2 flex items-center sm:hidden">
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-300 hover:bg-blue-600"
        aria-expanded={isMenuOpen}
      >
        <span className="sr-only">Open main menu</span>
        {isMenuOpen ? (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default MobileMenuToggle;
