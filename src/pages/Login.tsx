
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/utils/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    console.log("Attempting login with:", { email }); // Debug log

    try {
      const success = await login(email, password);
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
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="text-muted-foreground mt-2">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

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
