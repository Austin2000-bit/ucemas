
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react"
import { Link } from "react-router-dom"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card text-card-foreground mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">UCEMAS</h3>
            <p className="text-muted-foreground">
              UDSM CDS Electronic Management System - Making mobility accessible for everyone.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-muted-foreground hover:text-blue-500">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-500">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-500">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-muted-foreground hover:text-blue-500">Home</Link></li>
              <li><Link to="/register" className="text-muted-foreground hover:text-blue-500">Register</Link></li>
              <li><Link to="/book-ride" className="text-muted-foreground hover:text-blue-500">Book Ride</Link></li>
              <li><Link to="/complaint" className="text-muted-foreground hover:text-blue-500">File Complaint</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-blue-500">FAQs</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-blue-500">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-blue-500">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-blue-500">Accessibility</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <address className="not-italic text-muted-foreground">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} />
                <span>123 University Avenue</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} />
                <span>contact@ucemas.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </div>
            </address>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground">
          <p>&copy; {currentYear} UDSM CDS Electronic Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
