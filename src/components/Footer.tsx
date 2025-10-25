const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card text-card-foreground mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="text-center text-muted-foreground">
          <p>&copy; {currentYear} UDSM CDS Electronic Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
