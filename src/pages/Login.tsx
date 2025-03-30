
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt with:", username, password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar title="Login" />
      
      {/* Login form */}
      <div className="flex flex-col items-center justify-center px-4 py-16 flex-grow">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded shadow-sm">
          <h2 className="text-center text-xl font-medium mb-8 dark:text-white">Welcome Back!</h2>
          
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
              className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Login
            </Button>
            
            <p className="text-center text-sm mt-4 dark:text-gray-300">
              Don't have an account? <Link to="/register" className="text-blue-500 hover:underline dark:text-blue-400">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;
