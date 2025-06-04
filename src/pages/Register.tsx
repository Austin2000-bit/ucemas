import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { SystemLogs } from "@/utils/systemLogs";
import { signUp, UserRole, supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, ShieldCheck, User, Building2 } from "lucide-react";

// Define form schema with validation
const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.enum(["admin", "helper", "student", "driver"], { required_error: "Please select a role." }),
  phone: z.string().regex(/^(\+\d{1,3})?\d{9,12}$/, { message: "Enter valid phone number with country code (+XXX)" }),
  disability_type: z.string().optional(),
  disability_video: z.custom<File>().optional(),
  bank_account: z.string().optional(),
  bank_name: z.enum(["CRDB", "NBC"]).optional(),
  bank_account_number: z.string()
    .regex(/^\d{13}$/, { message: "Bank account number must be exactly 13 digits." })
    .optional(),
  assistant_type: z.string().optional(),
  assistant_specialization: z.string().optional(),
  time_period: z.enum(["full_year", "semester", "half_semester"]).optional(),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirm_password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  terms_accepted: z.boolean().refine(val => val === true, { message: "You must accept terms and conditions." })
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

type FormValues = z.infer<typeof formSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Initialize form with default values and validation schema
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: undefined,
      phone: "",
      disability_type: "",
      bank_account: "",
      bank_name: undefined,
      bank_account_number: "",
      assistant_type: "",
      assistant_specialization: "",
      time_period: undefined,
      password: "",
      confirm_password: "",
      terms_accepted: false
    }
  });

  const handleRegister = async (data: FormValues) => {
    setLoading(true);

    try {
      let videoUrl = null;
      
      // Upload video if provided for students
      if (data.role === "student" && data.disability_video) {
        const videoFile = data.disability_video;
        const videoFileName = `disability_videos/${Date.now()}_${videoFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('videos')
          .upload(videoFileName, videoFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL for the uploaded video
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(videoFileName);
        
        videoUrl = publicUrl;
      }

      const { success, error } = await signUp(
        data.email,
        data.password,
        {
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role as UserRole,
          phone: data.phone,
          disability_type: data.role === "student" ? data.disability_type : undefined,
          bank_name: data.role === "helper" ? data.bank_name : undefined,
          bank_account_number: data.role === "helper" ? data.bank_account_number : undefined,
          assistant_type: data.role === "helper" ? data.assistant_type : undefined,
          assistant_specialization: data.role === "helper" ? data.assistant_specialization : undefined,
          time_period: data.role === "helper" ? data.time_period : undefined,
          status: data.role === "helper" ? "active" : undefined,
          metadata: data.role === "student" && videoUrl ? { disability_video_url: videoUrl } : undefined
        }
      );

      if (success) {
        SystemLogs.addLog(
          "User Registration",
          `New ${data.role} registered: ${data.first_name} ${data.last_name}`,
          "system",
          data.role
        );

        toast({
          title: "Registration Successful",
          description: `Welcome ${data.first_name} ${data.last_name}! You can now log in with your email and password.`,
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

  const role = form.watch("role");

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar title="Register" />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded shadow-sm">
          <h2 className="text-center text-xl font-medium mb-6 text-gray-900 dark:text-gray-100">Welcome to UDSNMS</h2>
          
          <div className="flex justify-center mb-6">
            <img 
              src="/undraw_sign-up_z2ku.png" 
              alt="Registration illustration" 
              className="h-24 rounded-full"
            />
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="First name"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Last name"
                            className="pl-8"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="+255XXXXXXXXX"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter with country code (e.g. +255)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="helper">Assistant</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {role === "student" && (
                <>
                  <FormField
                    control={form.control}
                    name="disability_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disability Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select disability type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="visual">Visual Impairment</SelectItem>
                            <SelectItem value="hearing">Hearing Impairment</SelectItem>
                            <SelectItem value="mobility">Mobility Impairment</SelectItem>
                            <SelectItem value="multiple">Multiple Disabilities</SelectItem>
                            <SelectItem value="albinism">Albinism</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disability_video"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Disability Video (Optional)</FormLabel>
                        <FormControl>
                          <div className="grid w-full items-center gap-1.5">
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Check if file is a video
                                  if (!file.type.startsWith('video/')) {
                                    toast({
                                      title: "Invalid file type",
                                      description: "Please upload a video file",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  // Check if file size is less than 100MB
                                  if (file.size > 100 * 1024 * 1024) {
                                    toast({
                                      title: "File too large",
                                      description: "Video must be less than 100MB",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  onChange(file);
                                }
                              }}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload a video file (max 100MB) demonstrating your disability type. This helps us better understand your needs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {role === "helper" && (
                <>
                  <FormField
                    control={form.control}
                    name="assistant_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assistant Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assistant Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="undergraduate">Undergraduate</SelectItem>
                            <SelectItem value="postgraduate">Postgraduate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assistant_specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assistant Specialization</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assistant Specialization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="reader">Reader</SelectItem>
                            <SelectItem value="note_taker">Note Taker</SelectItem>
                            <SelectItem value="mobility_assistant">Personal Assistant for Students with Mobility Problems</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Period Availability</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full_year">Full Academic Year</SelectItem>
                            <SelectItem value="semester">Semester</SelectItem>
                            <SelectItem value="half_semester">Half Semester</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <SelectValue placeholder="Select bank" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CRDB">CRDB Bank</SelectItem>
                            <SelectItem value="NBC">NBC Bank</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_account_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="Bank Account Number"
                              className="pl-8"
                              maxLength={13}
                              onKeyPress={(e) => {
                                // Allow only numeric input
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ShieldCheck className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Password"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ShieldCheck className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Confirm Password"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms_accepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I accept the terms and conditions *
                      </FormLabel>
                      <FormDescription>
                        You agree to our terms of service and privacy policy.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
          </Form>
        </div>
      </main>
    </div>
  );
};

export default Register;
