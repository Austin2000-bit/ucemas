
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ClerkProvider, useSignIn } from "@clerk/clerk-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", username, password);

    // Example Clerk integration for role-based authentication

    const { signIn } = useSignIn();

    signIn.create({
      identifier: username,
      password: password,
    }).then((response) => {
      const userRole = response.user?.publicMetadata?.role;
      if (userRole === "admin") {
        console.log("Admin login successful");
        // Redirect to admin dashboard
      } else if (userRole === "user") {
        console.log("User login successful");
        // Redirect to user dashboard
      } else {
        console.log("Unknown role");
      }
    }).catch((error) => {
      console.error("Login failed:", error);
    });console.log("Login attempt with:", username, password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar  />
      
      {/* Login form */}
      <div className="flex flex-col items-center justify-center px-4 py-16 flex-grow">
        <div className="w-full max-w-md bg-card text-card-foreground p-8 rounded shadow-md">
          <h2 className="text-center text-xl font-medium mb-8">Welcome Back!</h2>
          
          <div className="flex justify-center mb-8">
            <img 
              src="/undraw_access-account_aydp.png" 
              alt="Login illustration" 
              className="h-24 rounded-full"
            />
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
                required
              />
            </div>
            
            <div>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Login
            </Button>
            
            <p className="text-center text-sm mt-4">
              Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
      
    </div>
  );
};

export default Login;
