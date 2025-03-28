
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt with:", username, password);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <div className="bg-blue-400 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="font-medium">Login</div>
          </div>
        </div>
      </div>
      
      {/* Menu navigation */}
      <div className="bg-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-12 overflow-x-auto">
            <Link to="/" className="px-4 py-2 whitespace-nowrap">USNMS</Link>
            <Link to="/register" className="px-4 py-2 whitespace-nowrap">Register</Link>
            <Link to="/admin" className="px-4 py-2 whitespace-nowrap">Admin</Link>
            <Link to="/helper" className="px-4 py-2 whitespace-nowrap">Helper</Link>
            <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap">Book ride</Link>
            <Link to="/complaint" className="px-4 py-2 whitespace-nowrap">Complaint</Link>
          </div>
        </div>
      </div>
      
      {/* Login form */}
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white p-8 rounded shadow-sm">
          <h2 className="text-center text-xl font-medium mb-8">Welcome Back!</h2>
          
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/38718d37-4552-47c1-bb5e-f38e5f251984.png" 
              alt="Login illustration" 
              className="h-24"
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
