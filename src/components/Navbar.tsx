
import { Link } from "react-router-dom"
import { ThemeToggle } from "@/components/theme-toggle"

type NavbarProps = {
  title?: string
}

const Navbar = ({ title = "USNMS" }: NavbarProps) => {
  return (
    <>
      {/* Top navigation */}
      <div className="bg-card text-card-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="font-medium">{title}</div>
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      {/* Menu navigation */}
      <div className="bg-blue-500 dark:bg-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-12 overflow-x-auto">
            <Link to="/" className="px-4 py-2 whitespace-nowrap">USNMS</Link>
            <Link to="/register" className="px-4 py-2 whitespace-nowrap">Register</Link>
            <Link to="/helper" className="px-4 py-2 whitespace-nowrap">Helper</Link>
            <Link to="/student" className="px-4 py-2 whitespace-nowrap">Student</Link>
            <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap">Book ride</Link>
            <Link to="/admin" className="px-4 py-2 whitespace-nowrap">Admin</Link>
            <Link to="/complaint" className="px-4 py-2 whitespace-nowrap">Complaint</Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
