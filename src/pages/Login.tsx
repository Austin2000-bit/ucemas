import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
<<<<<<< HEAD
import { Lock, Mail, Keyboard, Info, Eye, EyeOff } from "lucide-react";
import FontSizeSelector from "@/components/font-size-selector";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
=======
import { Lock, Mail } from "lucide-react";
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." })
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const [loading, setLoading] = useState(false);
<<<<<<< HEAD
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
=======
  const { login } = useAuth();
  const navigate = useNavigate();
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136

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
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center p-4">
<<<<<<< HEAD
        <div className="max-w-md w-full">
          {/* Font Size Selector */}
          <div className="mb-4 flex justify-end">
            <FontSizeSelector />
          </div>

          <Card className="shadow-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">Welcome to UCEMAS</CardTitle>
              <CardDescription>UDSM CDS Electronic Management System</CardDescription>
            </CardHeader>
            
            <CardContent>
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
=======
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
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
<<<<<<< HEAD
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-8 pr-10"
                            autoComplete="current-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
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

              {/* Keyboard Shortcuts Info */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Keyboard Shortcuts</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="h-6 px-2"
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </div>
                
                {showShortcuts && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Font Size:</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">Ctrl+1</Badge>
                        <Badge variant="outline" className="text-xs">Ctrl+2</Badge>
                        <Badge variant="outline" className="text-xs">Ctrl+3</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Focus Email:</span>
                      <Badge variant="outline" className="text-xs">Ctrl+K</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Submit Form:</span>
                      <Badge variant="outline" className="text-xs">Ctrl+Enter</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Clear Focus:</span>
                      <Badge variant="outline" className="text-xs">Esc</Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
=======
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

            
          </div>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
        </div>
      </main>
    </div>
  );
};

export default Login;
