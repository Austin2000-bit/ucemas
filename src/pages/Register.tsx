import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
<<<<<<< HEAD
import { Link, useNavigate } from "react-router-dom";
import { UserRole } from "@/lib/supabase";
import { UserRegistrationService, RegistrationData } from "@/services/userRegistrationService";
import { Info } from "lucide-react";
import Navbar from "@/components/Navbar";

// Services for each disability type
const disabilityServices = {
  "Total Blind": ["reading", "mobility services", "Transcription"],
  "Low Vision": ["Reading", "mobility for complicated infrastructure", "Large prints"],
  "Total Deaf": ["Note taking service", "Interpretation"],
  "Hard of hearing": ["Note taking service"],
  "Deafblind": ["Mobility", "note taking"],
  "Physical Disability": ["Mobility"],
  "Chronic health Disease": ["Mobility", "health care"]
=======
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/lib/supabase";
import { UserRegistrationService, RegistrationData } from "@/services/userRegistrationService";
import { Info } from "lucide-react";

const disabilityServices = {
  mobility: [
    "Assistive devices (wheelchairs, crutches) via CCBRT or TLMB",
    "Physical therapy/referral info through local health centers"
  ],
  visual: [
    "Braille education via Uhuru School for the Blind",
    "Screen reader training/tools (e.g., NVDA, JAWS)",
    "Access to audiobook libraries or TAHRA audiobooks",
    "Eye care services via KCMC, Muhimbili Eye Clinic"
  ],
  hearing: [
    "Tanzanian Sign Language (TSL) learning resources",
    "Hearing aid access through Ears Inc. Tanzania",
    "Interpreter service directories"
  ],
  cognitive: [
    "Learning support services",
    "Educational accommodations",
    "Cognitive therapy resources"
  ],
  other: [
    "Customized support services",
    "Specialized resource referrals"
  ]
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
    disabilityType: "",
    disabilityVideo: null as File | null,
    assistant_type: "" as 'undergraduate' | 'postgraduate',
    assistant_specialization: "" as 'reader' | 'note_taker' | 'mobility_assistant',
    time_period: "" as 'full_year' | 'semester' | 'half_semester',
    bankName: "" as 'CRDB' | 'NBC',
    bankAccountNumber: "",
    profilePicture: null as File | null,
    applicationLetter: null as File | null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "bankAccountNumber") {
<<<<<<< HEAD
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
=======
      // Only allow numbers for bank account
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

<<<<<<< HEAD
    const maxVideoSize = 100 * 1024 * 1024;
    const maxSize = 2 * 1024 * 1024;
=======
    const maxVideoSize = 100 * 1024 * 1024; // 100MB for videos
    const maxSize = 2 * 1024 * 1024; // 2MB for other files
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (isVideo) {
      if (file.size > maxVideoSize) {
        alert("Video must be less than 100MB");
<<<<<<< HEAD
        e.target.value = "";
=======
        e.target.value = ""; // Reset the input
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
        return;
      }
      setFormData(prev => ({ ...prev, disabilityVideo: file }));
    } else if (isImage) {
      const img = new Image();
      img.onload = () => {
        if (file.size > maxSize || img.width > 1024 || img.height > 1024) {
<<<<<<< HEAD
          alert("Image must be less than 2MB and within 1024x1024");
          e.target.value = "";
=======
          alert("Image must be less than 2MB and dimensions within 1024x1024.");
          e.target.value = ""; // Reset the input
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
        } else {
          setFormData(prev => ({ ...prev, profilePicture: file }));
        }
      };
      img.src = URL.createObjectURL(file);
    } else if (isPDF) {
      if (file.size > maxSize) {
        alert("PDF must be less than 2MB");
<<<<<<< HEAD
        e.target.value = "";
=======
        e.target.value = ""; // Reset the input
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
        return;
      }
      setFormData(prev => ({ ...prev, applicationLetter: file }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD

=======
    
    // Validate required fields
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    if (!formData.firstname || !formData.lastname || !formData.email || 
        !formData.password || !formData.confirmPassword || !formData.role || 
        !formData.phone || !formData.profilePicture) {
      alert("Please fill in all required fields");
      return;
    }

<<<<<<< HEAD
=======
    // Validate password match
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

<<<<<<< HEAD
=======
    // Validate password strength
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

<<<<<<< HEAD
=======
    // Validate helper-specific fields
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    if (formData.role === "helper" && 
        (!formData.assistant_type || !formData.assistant_specialization || 
         !formData.time_period || !formData.bankName || !formData.bankAccountNumber || !formData.applicationLetter)) {
      alert("Please fill in all helper-specific fields and upload an application letter");
      return;
    }

<<<<<<< HEAD
=======
    // Validate student-specific fields
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    if (formData.role === "student" && !formData.disabilityType) {
      alert("Please select a disability type");
      return;
    }

    try {
<<<<<<< HEAD
=======
      console.log('Starting registration with data:', {
        email: formData.email,
        role: formData.role,
        first_name: formData.firstname,
        last_name: formData.lastname,
        phone: formData.phone,
        disability_type: formData.role === "student" ? formData.disabilityType : undefined,
        bank_name: formData.role === "helper" ? formData.bankName : undefined,
        bank_account_number: formData.role === "helper" ? formData.bankAccountNumber : undefined,
        assistant_type: formData.role === "helper" ? formData.assistant_type : undefined,
        assistant_specialization: formData.role === "helper" ? formData.assistant_specialization : undefined,
        time_period: formData.role === "helper" ? formData.time_period : undefined,
        profile_picture: formData.profilePicture,
        application_letter: formData.role === "helper" ? formData.applicationLetter : undefined,
        disability_video: formData.role === "student" ? formData.disabilityVideo : undefined
      });

      // Use the comprehensive registration service
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
      const registrationData: RegistrationData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstname,
        last_name: formData.lastname,
        role: formData.role as UserRole,
        phone: formData.phone,
        disability_type: formData.role === "student" ? formData.disabilityType : undefined,
<<<<<<< HEAD
        services_needed: formData.role === "student" && formData.disabilityType
          ? disabilityServices[formData.disabilityType as keyof typeof disabilityServices]
          : undefined,
=======
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
        bank_name: formData.role === "helper" ? formData.bankName : undefined,
        bank_account_number: formData.role === "helper" ? formData.bankAccountNumber : undefined,
        assistant_type: formData.role === "helper" ? formData.assistant_type : undefined,
        assistant_specialization: formData.role === "helper" ? formData.assistant_specialization : undefined,
        time_period: formData.role === "helper" ? formData.time_period : undefined,
        profile_picture: formData.profilePicture,
        application_letter: formData.role === "helper" ? formData.applicationLetter : undefined,
        disability_video: formData.role === "student" ? formData.disabilityVideo : undefined
      };

      const result = await UserRegistrationService.registerUser(registrationData);

      if (result.success) {
        alert("Registration successful! Please check your email to confirm your account.");
        navigate("/login");
      } else {
        alert(result.error?.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration");
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-center text-xl font-medium mb-8 text-gray-900 dark:text-white">Welcome onboard</h2>
          <div className="flex justify-center mb-8">
            <img src="/undraw_sign-up_z2ku.png" alt="Registration illustration" className="h-24 rounded-full" />
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Picture <span className="text-red-500">*</span>
              </label>
              <Input type="file" name="profilePicture" accept="image/*" onChange={handleFileChange} required />
            </div>

            <Input type="text" name="firstname" placeholder="First Name *" value={formData.firstname} onChange={handleChange} required />
            <Input type="text" name="lastname" placeholder="Last Name *" value={formData.lastname} onChange={handleChange} required />
            <Input type="email" name="email" placeholder="Email *" value={formData.email} onChange={handleChange} required />
            <Input type="password" name="password" placeholder="Password *" value={formData.password} onChange={handleChange} required />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 6 characters long</p>
            <Input type="password" name="confirmPassword" placeholder="Confirm Password *" value={formData.confirmPassword} onChange={handleChange} required />

            <Select onValueChange={(value) => handleSelectChange("role", value)} required>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select Role *" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="helper">Assistant</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Input type="tel" name="phone" placeholder="Phone Number *" value={formData.phone} onChange={handleChange} required />

            {formData.role === "student" && (
              <>
                <Select onValueChange={(value) => handleSelectChange("disabilityType", value)} required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Disability Type *" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(disabilityServices).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.disabilityType && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      <h3 className="font-medium text-blue-700 dark:text-blue-300">Needed Services</h3>
                    </div>
                    <ul className="list-disc list-inside space-y-2 text-sm text-blue-600 dark:text-blue-400">
=======
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture <span className="text-red-500">*</span>
              </label>
              <Input
                type="file"
                name="profilePicture"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full"
                required
              />
            </div>

            <div>
              <Input
                type="text"
                name="firstname"
                placeholder="First Name *"
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
                placeholder="Last Name *"
                value={formData.lastname}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>

            <div>
              <Input
                type="email"
                name="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>

            <div>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>
            
            <div>
              <Select onValueChange={(value) => handleSelectChange("role", value)} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Role *" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="helper">Helper</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>

            {formData.role === "student" && (
              <>
                <div>
                  <Select onValueChange={(value) => handleSelectChange("disabilityType", value)} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Disability Type *" />
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

                {formData.disabilityType && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium text-blue-700">Available Services</h3>
                    </div>
                    <ul className="list-disc list-inside space-y-2 text-sm text-blue-600">
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                      {disabilityServices[formData.disabilityType as keyof typeof disabilityServices].map((service, index) => (
                        <li key={index}>{service}</li>
                      ))}
                    </ul>
                  </div>
                )}

<<<<<<< HEAD
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
                  Upload Video (Optional) - If your disability is hard to explain
                </label>
                <Input type="file" name="disabilityVideo" accept="video/*" onChange={handleFileChange} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum file size: 100MB</p>
=======
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Video (Optional) - If your disability is hard to explain
                  </label>
                  <Input
                    type="file"
                    name="disabilityVideo"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum file size: 100MB</p>
                </div>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
              </>
            )}

            {formData.role === "helper" && (
              <>
<<<<<<< HEAD
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Letter <span className="text-red-500">*</span></label>
                <Input type="file" name="applicationLetter" accept=".pdf" onChange={handleFileChange} required />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload your application letter in PDF format (max 2MB)</p>

                <Select onValueChange={(value) => handleSelectChange("assistant_type", value)} required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Assistant Category *" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleSelectChange("assistant_specialization", value)} required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Assistant Type *" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">Reader</SelectItem>
                    <SelectItem value="note_taker">Note Taker</SelectItem>
                    <SelectItem value="mobility_assistant">Mobility Assistant</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleSelectChange("time_period", value)} required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Time Period *" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_year">Full Year</SelectItem>
                    <SelectItem value="semester">Semester</SelectItem>
                    <SelectItem value="half_semester">Half Semester</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleSelectChange("bankName", value)} required>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select Bank *" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRDB">CRDB Bank</SelectItem>
                    <SelectItem value="NBC">NBC Bank</SelectItem>
                  </SelectContent>
                </Select>

                <Input type="text" name="bankAccountNumber" placeholder="Bank Account Number *" value={formData.bankAccountNumber} onChange={handleChange} required />
              </>
            )}

            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">Register</Button>

            <p className="text-center text-sm mt-4 text-gray-600 dark:text-gray-400">
              Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">Sign in</Link>
=======
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Letter <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="file"
                    name="applicationLetter"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload your application letter in PDF format (max 2MB)</p>
                </div>

                <div>
                  <Select onValueChange={(value) => handleSelectChange("assistant_type", value)} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Assistant Category *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select onValueChange={(value) => handleSelectChange("assistant_specialization", value)} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Assistant Type *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reader">Reader</SelectItem>
                      <SelectItem value="note_taker">Note Taker</SelectItem>
                      <SelectItem value="mobility_assistant">Mobility Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select onValueChange={(value) => handleSelectChange("time_period", value)} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Time Period *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_year">Full Year</SelectItem>
                      <SelectItem value="semester">Semester</SelectItem>
                      <SelectItem value="half_semester">Half Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select onValueChange={(value) => handleSelectChange("bankName", value)} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Bank *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRDB">CRDB Bank</SelectItem>
                      <SelectItem value="NBC">NBC Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Input
                    type="text"
                    name="bankAccountNumber"
                    placeholder="Bank Account Number *"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                </div>
              </>
            )}
              
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Register
            </Button>
              
            <p className="text-center text-sm mt-4">
              Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default Register;
=======
export default Register;
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
