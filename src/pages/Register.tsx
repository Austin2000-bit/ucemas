
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    role: "",
    phone: "",
    disabilityType: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registration data:", formData);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <div className="bg-blue-400 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="font-medium">Register</div>
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
            <Link to="/complaint" className="px-4 py-2 whitespace-nowrap">complaint</Link>
          </div>
        </div>
      </div>
      
      {/* Registration form */}
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white p-8 rounded shadow-sm">
          <h2 className="text-center text-xl font-medium mb-8">Welcome onboard</h2>
          
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/71e25707-92bf-4510-b0d5-2d6d0a94b783.png" 
              alt="Registration illustration" 
              className="h-24"
            />
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Select onValueChange={(value) => handleSelectChange("firstname", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Firstname" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John</SelectItem>
                  <SelectItem value="jane">Jane</SelectItem>
                  <SelectItem value="alex">Alex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select onValueChange={(value) => handleSelectChange("lastname", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="lastname" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doe">Doe</SelectItem>
                  <SelectItem value="smith">Smith</SelectItem>
                  <SelectItem value="johnson">Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select onValueChange={(value) => handleSelectChange("email", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user@example.com">user@example.com</SelectItem>
                  <SelectItem value="test@example.com">test@example.com</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select onValueChange={(value) => handleSelectChange("phone", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="phone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="123-456-7890">123-456-7890</SelectItem>
                  <SelectItem value="234-567-8901">234-567-8901</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select onValueChange={(value) => handleSelectChange("disabilityType", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Disability Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobility">Mobility</SelectItem>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="hearing">Hearing</SelectItem>
                  <SelectItem value="cognitive">Cognitive</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Register
            </Button>
            
            <p className="text-center text-sm mt-4">
              Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
