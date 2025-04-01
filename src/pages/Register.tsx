import { ThemeToggle } from "@/components/theme-toggle";
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
        </div>
      </div>
      
      {/* Menu navigation */}

     <div className="bg-blue-500 text-white">
             <div className="container mx-auto px-4">
                 <div className="flex items-center justify-between">
                 <div className="flex">
                   <Link to="/" className="px-4 py-2 whitespace-nowrap align-items-left">USNMS</Link>
                   </div>
                   <div>
                   <Link to="/register" className="px-4 py-2 whitespace-nowrap">Register</Link>
                   <Link to="/helper" className="px-4 py-2 whitespace-nowrap">Helper</Link>
                   <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap">Book ride</Link>
                   <Link to="/admin" className="px-4 py-2 whitespace-nowrap">Admin</Link>
                   <Link to="/complaint" className="px-4 py-2 whitespace-nowrap font-medium">Complaint</Link>
                 </div>
                 <div>
                   <ThemeToggle />
                 </div>
                 </div>
             </div>
           </div>
      
      {/* Registration form */}
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white p-8 rounded shadow-sm">
          <h2 className="text-center text-xl font-medium mb-8">Welcome onboard</h2>
          
          <div className="flex justify-center mb-8">
            <img 
              src="/undraw_sign-up_z2ku.png" 
              alt="Registration illustration" 
              className="h-24 rounded-full"
            />
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Input
                type="text"
                name="firstname"
                placeholder="Firstname"
                value={formData.firstname}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>
            
            <div>
              <Input
                type="text"
                name="lastname"
                placeholder="Lastname"
                value={formData.lastname}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <Input
                type="file"
                name="profilePicture"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const maxSize = 2 * 1024 * 1024; // 2MB
                    const img = new Image();
                    img.onload = () => {
                      if (file.size > maxSize || img.width > 1024 || img.height > 1024) {
                        alert("Image must be less than 2MB and dimensions within 1024x1024.");
                        e.target.value = ""; // Reset the input
                      }
                    };
                    img.src = URL.createObjectURL(file);
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>
            
            <div>
              <Select onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="Helper">Helper</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "Helper" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Helper Application Letter (PDF, max 2MB)
                </label>
                <Input
                  type="file"
                  name="helperApplicationLetter"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const maxSize = 2 * 1024 * 1024; // 2MB
                      if (file.size > maxSize) {
                        alert("File must be less than 2MB.");
                        e.target.value = ""; // Reset the input
                      }
                    }
                  }}
                  className="w-full"
                />
              </div>
            )}
            <div>
              <Input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full"
                required
              />
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                If the disability is hard to explain, upload a short video (max 5MB, MP4 format)
              </label>
              <Input
                type="file"
                name="disabilityVideo"
                accept="video/mp4"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSize) {
                      alert("Video must be less than 5MB.");
                      e.target.value = ""; // Reset the input
                    }
                  }
                }}
                className="w-full"
              />
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
