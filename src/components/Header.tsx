
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-blue-600">Login System</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
