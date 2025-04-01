import { Link } from "react-router-dom"
import { ThemeToggle } from "@/components/theme-toggle"

type NavbarProps = {
  title?: string
}

const Navbar = ({ title = "USNMS" }: NavbarProps) => {
  return (
    <>
      {/* Menu navigation */}
      <div className="bg-blue-500 dark:bg-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <Link to="/" className="px-4 py-2 whitespace-nowrap font-poppins">USNMS</Link>
            <div className="flex items-center justify-center space-x-2">
              <Link to="/register" className="px-4 py-2 whitespace-nowrap font-poppins">Register</Link>
              <Link to="/helper" className="px-4 py-2 whitespace-nowrap font-poppins">Helper</Link>
              <Link to="/student" className="px-4 py-2 whitespace-nowrap font-poppins">Student</Link>
              <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap font-poppins">Book ride</Link>
              <Link to="/admin" className="px-4 py-2 whitespace-nowrap font-poppins">Admin</Link>
              <Link to="/complaint" className="px-4 py-2 whitespace-nowrap font-poppins">Complaint</Link>
            </div>
            <div>
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
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar