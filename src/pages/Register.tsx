
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
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";

const phoneRegex = /^(0|\+255)[0-9]{9}$/;
const bankAccountRegex = /^\d{10,16}$/;

const registerFormSchema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "helper", "student", "driver"], {
    required_error: "Please select a role",
  }),
  phone: z.string().regex(phoneRegex, "Phone number must be in format +255XXXXXXXXX or 0XXXXXXXXX"),
  disability_type: z.string().optional(),
  bank_name: z.enum(["CRDB", "NBC"], {
    required_error: "Please select a bank",
  }).optional(),
  bank_account_number: z.string().regex(bankAccountRegex, "Bank account must be 10-16 digits").optional(),
  time_period: z.enum(["full_year", "semester", "half_semester"], {
    required_error: "Please select a time period",
  }).optional(),
  assistant_type: z.string().optional(),
  assistant_specialization: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})
.refine(
  (data) => !(data.role === "helper" && (!data.bank_name || !data.bank_account_number)),
  {
    message: "Bank details are required for assistants",
    path: ["bank_account_number"],
  }
)
.refine(
  (data) => !(data.role === "helper" && !data.time_period),
  {
    message: "Time period is required for assistants",
    path: ["time_period"],
  }
);

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: undefined,
      phone: "",
      disability_type: "",
      bank_name: undefined,
      bank_account_number: "",
      time_period: undefined,
      assistant_type: "",
      assistant_specialization: "",
      password: "",
      confirm_password: "",
    },
  });

  const role = form.watch("role");

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);

    try {
      const { success, error } = await signUp(
        values.email,
        values.password,
        {
          first_name: values.first_name,
          last_name: values.last_name,
          role: values.role,
          phone: values.phone,
          bank_name: values.bank_name,
          bank_account_number: values.bank_account_number,
          disability_type: values.role === "student" ? values.disability_type : undefined,
          time_period: values.role === "helper" ? values.time_period : undefined,
          status: "active"
        }
      );

      if (success) {
        SystemLogs.addLog(
          "User Registration",
          `New ${values.role} registered: ${values.first_name} ${values.last_name}`,
          "system",
          values.role
        );

        toast({
          title: "Registration Successful",
          description: `Welcome ${values.first_name} ${values.last_name}! You can now log in with your email and password.`,
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
          <h2 className="text-center text-xl font-medium mb-8 text-gray-900 dark:text-gray-100">Welcome to UDSNMS</h2>
          
          <div className="flex justify-center mb-8">
            <img 
              src="/undraw_sign-up_z2ku.png" 
              alt="Registration illustration" 
              className="h-24 rounded-full"
            />
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="First name"
                          className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          {...field}
                        />
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
                      <FormControl>
                        <Input
                          placeholder="Last name"
                          className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email"
                          className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
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
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Phone number (0XXXXXXXXX or +255XXXXXXXXX)"
                          className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                            <SelectValue placeholder="Role" />
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
              </div>

              {/* Role-specific fields */}
              {role === 'student' && (
                <FormField
                  control={form.control}
                  name="disability_type"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                            <SelectValue placeholder="Disability Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
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
              )}

              {role === 'helper' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="assistant_type"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
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
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                              <SelectValue placeholder="Bank Name" />
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
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Bank Account Number (10-16 digits)"
                            className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time_period"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                              <SelectValue placeholder="Time Period" />
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
                </div>
              )}

              {/* Password Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Password"
                          className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          {...field}
                        />
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
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm Password"
                          className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
          </Form>
        </div>
      </main>
    </div>
  );
};

export default Register;
