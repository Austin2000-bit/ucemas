
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/utils/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." })
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleSubmit = async (data: FormValues) => {
    setLoading(true);
    console.log("Attempting login with:", { email: data.email }); // Debug log

    try {
      const success = await login(data.email, data.password);
      console.log("Login result:", success); // Debug log
      
      if (success) {
        toast({
          title: "Success!",
          description: "You are now logged in.",
        });
        navigate("/");
      } else {
        toast({
          title: "Invalid credentials",
          description: "Please check your email and password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error); // Debug log
      toast({
        title: "Error!",
        description: "Failed to log in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar title="Login" />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground">Welcome to UDSNMS</h1>
              <p className="text-muted-foreground mt-2">University Disabled Students Need Management System</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            className="pl-8"
                            autoComplete="email"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="pl-8"
                            autoComplete="current-password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <p className="text-muted-foreground text-sm">
                Demo accounts:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div className="text-left p-2 border rounded bg-muted/50">
                  <p className="font-medium">Admin</p>
                  <p>admin@example.com</p>
                  <p>admin123</p>
                </div>
                <div className="text-left p-2 border rounded bg-muted/50">
                  <p className="font-medium">Helper</p>
                  <p>amanda@example.com</p>
                  <p>helper123</p>
                </div>
                <div className="text-left p-2 border rounded bg-muted/50">
                  <p className="font-medium">Student</p>
                  <p>john@example.com</p>
                  <p>student123</p>
                </div>
                <div className="text-left p-2 border rounded bg-muted/50">
                  <p className="font-medium">Driver</p>
                  <p>driver@example.com</p>
                  <p>driver123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
