import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { SystemLogs } from "@/utils/systemLogs";
import { signUp, UserRole } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "" as UserRole,
    phone: "",
    disability_type: "",
    bank_account: "",
    bank_account_number: "",
    assistant_type: "",
    assistant_specialization: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.first_name || !formData.last_name || !formData.email || !formData.role || !formData.phone || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate role
    if (!["admin", "helper", "student", "driver"].includes(formData.role)) {
      toast({
        title: "Invalid Role",
        description: "Please select a valid role.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { success, error } = await signUp(
        formData.email,
        formData.password,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role
        }
      );

      if (success) {
        SystemLogs.addLog(
          "User Registration",
          `New ${formData.role} registered: ${formData.first_name} ${formData.last_name}`,
          "system",
          formData.role
        );

        toast({
          title: "Registration Successful",
          description: `Welcome ${formData.first_name} ${formData.last_name}! You can now log in with your email and password.`,
        });

        navigate("/login");
      } else {
        toast({
          title: "Registration Failed",
          description: error?.message || "Failed to register user.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Error",
        description: "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar title="Register" />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded shadow-sm">
          <h2 className="text-center text-xl font-medium mb-8 text-gray-900 dark:text-gray-100">Welcome onboard</h2>
          
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
                name="first_name"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
            </div>
            
            <div>
              <Input
                type="text"
                name="last_name"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
            </div>
            
            <div>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
            </div>
            
            <div>
              <Select onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="helper">Assistant</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
            </div>

            {formData.role === 'helper' && (
              <>
                <div>
                  <Select onValueChange={(value) => handleSelectChange("assistant_type", value)}>
                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                      <SelectValue placeholder="Assistant Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select onValueChange={(value) => handleSelectChange("assistant_specialization", value)}>
                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                      <SelectValue placeholder="Assistant Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reader">Reader</SelectItem>
                      <SelectItem value="note_taker">Note Taker</SelectItem>
                      <SelectItem value="mobility_assistant">Personal Assistant for Students with Mobility Problems</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Input
                    type="text"
                    name="bank_account"
                    placeholder="Bank Name"
                    value={formData.bank_account}
                    onChange={handleChange}
                    className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <Input
                    type="text"
                    name="bank_account_number"
                    placeholder="Bank Account Number"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    required
                  />
                </div>
              </>
            )}

            {formData.role === 'student' && (
              <>
                <div>
                  <Select onValueChange={(value) => handleSelectChange("disability_type", value)}>
                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                      <SelectValue placeholder="Disability Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visual">Visual Impairment</SelectItem>
                      <SelectItem value="hearing">Hearing Impairment</SelectItem>
                      <SelectItem value="mobility">Mobility Impairment</SelectItem>
                      <SelectItem value="multiple">Multiple Disabilities</SelectItem>
                      <SelectItem value="albinism">Albinism</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
            
            <p className="text-center text-gray-600 dark:text-gray-400">
              Already have an account? <Link to="/login" className="text-blue-500 hover:underline dark:text-blue-400">Sign in</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
