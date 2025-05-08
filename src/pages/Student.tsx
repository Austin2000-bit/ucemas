
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { db, StudentOtp, StudentConfirmation } from "@/lib/supabase";
import { useAuth } from "@/utils/auth";
import { SystemLogs } from "@/utils/systemLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Student = () => {
  const { user } = useAuth();
  const studentId = user?.id || "";
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [todayConfirmed, setTodayConfirmed] = useState(false);
  const [recentConfirmations, setRecentConfirmations] = useState<StudentConfirmation[]>([]);
  const [pendingOtp, setPendingOtp] = useState<StudentOtp | null>(null);
  const [assignedHelper, setAssignedHelper] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const form = useForm({
    defaultValues: {
      otp: "",
    }
  });

  // Check if student has already confirmed help today and if there's a pending OTP
  useEffect(() => {
    const loadData = async () => {
      if (!studentId) return;

      // Get student's confirmations
      const confirmations = await db.getStudentConfirmationsByStudent(studentId);
      setRecentConfirmations(confirmations);
      
      // Check if there's a confirmation for today
      const today = new Date().toISOString().split('T')[0];
      const todayConfirm = confirmations.find(conf => conf.date === today);
      setTodayConfirmed(!!todayConfirm);
      
      // Check if there's a pending OTP for this student
      if (!todayConfirm) {
        const studentOtp = await db.getStudentOtp(studentId);
        setPendingOtp(studentOtp);
        
        // Auto-fill the OTP field if there's a pending OTP
        if (studentOtp?.otp) {
          form.setValue("otp", studentOtp.otp);
        }
      } else {
        setPendingOtp(null);
      }
    };
    
    loadData();
    
    // Set up an interval to check for new OTPs every 10 seconds
    const interval = setInterval(async () => {
      if (!studentId || todayConfirmed) return;
      
      const studentOtp = await db.getStudentOtp(studentId);
      
      if (studentOtp && (!pendingOtp || studentOtp.timestamp !== pendingOtp.timestamp)) {
        setPendingOtp(studentOtp);
        form.setValue("otp", studentOtp.otp);
        
        // Show toast notification for new OTP
        toast({
          title: "New OTP Received",
          description: `Helper ${studentOtp.helperName} has sent you a verification code.`,
        });
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [form, pendingOtp, todayConfirmed, studentId]);
  
  useEffect(() => {
    // Load user profile
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const currentUser = users.find((u: any) => u.id === user?.id);
    setUserProfile(currentUser);
  }, [user?.id]);
  
  const handleConfirm = async () => {
    const otpValue = form.getValues("otp");
    if (otpValue.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 4-digit OTP",
        variant: "destructive",
      });
      return;
    }

    if (!pendingOtp) {
      toast({
        title: "No OTP Found",
        description: "Please wait for your helper to send you an OTP",
        variant: "destructive",
      });
      return;
    }

    if (otpValue !== pendingOtp.otp) {
      toast({
        title: "Incorrect OTP",
        description: "The OTP you entered is incorrect",
        variant: "destructive",
      });
      return;
    }

    // Save confirmation to localStorage
    const today = new Date().toISOString().split('T')[0];
    const studentConfirmations = JSON.parse(localStorage.getItem("studentHelpConfirmations") || "[]");
    
    // Prevent multiple confirmations for the same day
    if (todayConfirmed) {
      toast({
        title: "Already Confirmed",
        description: "You have already confirmed help for today",
        variant: "destructive",
      });
      return;
    }
    
    const newConfirmation = {
      date: today,
      helperId: pendingOtp.helperId || "", // Use the helperId from the OTP
      student: studentId,
      timestamp: Date.now()
    };
    
    studentConfirmations.push(newConfirmation);
    localStorage.setItem("studentHelpConfirmations", JSON.stringify(studentConfirmations));
    
    // Update state
    setTodayConfirmed(true);
    setRecentConfirmations(prev => [newConfirmation, ...prev]);
    setPendingOtp(null);
    
    // Log the confirmation
    SystemLogs.addLog(
      "Help confirmed",
      `Student ${user?.first_name} ${user?.last_name} confirmed help from helper ${pendingOtp.helperName}`,
      studentId,
      "student"
    );
    
    toast({
      title: "Help confirmed",
      description: "Thank you for confirming the help provision.",
    });
    
    form.reset();
  };
  
  const getHelperName = (helperId: string) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const helper = users.find((u: any) => u.id === helperId);
    return helper ? `${helper.first_name} ${helper.last_name}` : 'Unknown Helper';
  };
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="flex flex-col md:flex-row flex-grow">
        {/* Left Panel - Help Confirmation */}
        <div className="md:w-1/3 bg-gray-300 dark:bg-gray-800 p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">HELP CONFIRMATION</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-blue-500 dark:text-blue-400">Daily confirmation</span>
          </div>
          
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Recent Confirmations</h3>
            
            {recentConfirmations.length > 0 ? (
              <div className="space-y-2">
                {recentConfirmations.slice(0, 3).map((conf, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{new Date(conf.date).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm font-medium">{getHelperName(conf.helperId)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recent confirmations</p>
            )}
          </div>
          
          <div className="mt-auto">
            <Link to="/book-ride">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
                Book Free Ride
              </Button>
            </Link>
          </div>

          {/* Assigned Helper Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Assigned Helper</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedHelper ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={assignedHelper.photo} />
                    <AvatarFallback>
                      {assignedHelper.firstName[0]}{assignedHelper.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {assignedHelper.firstName} {assignedHelper.lastName}
                    </h3>
                    <p className="text-muted-foreground">{assignedHelper.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available for assistance during working hours
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No helper assigned yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - User Profile and OTP */}
        <div className="flex-1 p-6 dark:text-white">
          <div className="flex justify-between mb-8">
            <h2 className="text-lg text-gray-500 dark:text-gray-400">confirm help provision</h2>
          </div>
          
          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32 mb-4">
              <AvatarImage src={userProfile?.photo || "/default-avatar.png"} alt={`${userProfile?.firstName} ${userProfile?.lastName}`} />
              <AvatarFallback>{userProfile?.firstName?.[0]}{userProfile?.lastName?.[0]}</AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-100">
              {userProfile?.firstName?.toUpperCase()} {userProfile?.lastName?.toUpperCase()}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Any dishonesty will not be forgiven</p>
            
            <div className="flex items-center gap-2 mb-6">
              <span className="font-medium">{new Date(currentDate).toLocaleDateString()}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {todayConfirmed 
                  ? "You've confirmed help for today" 
                  : "confirm if your helper has assisted you today"}
              </span>
            </div>
            
            {pendingOtp && !todayConfirmed && (
              <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20 w-full max-w-md">
                <Clock className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700 dark:text-blue-400">New OTP Received</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-300">
                  Helper {pendingOtp.helperName} has sent you a verification code at {formatTime(pendingOtp.timestamp)}. 
                  The code has been automatically filled in for you.
                </AlertDescription>
              </Alert>
            )}
            
            {todayConfirmed ? (
              <div className="flex flex-col items-center justify-center mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg w-full max-w-xs">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-center text-green-700 dark:text-green-400">
                  Help confirmed for today
                </p>
              </div>
            ) : (
              <>
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem className="mb-6 w-full flex justify-center">
                        <FormControl>
                          <InputOTP maxLength={4} {...field}>
                            <InputOTPGroup className="gap-4">
                              <InputOTPSlot index={0} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={1} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={2} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={3} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </Form>
                
                <div className="text-center mb-6">
                  <span className="text-blue-500 dark:text-blue-400">
                    {pendingOtp 
                      ? "OTP automatically filled from helper" 
                      : "Enter OTP provided by helper"}
                  </span>
                </div>
                
                <Button 
                  className="w-full max-w-xs bg-blue-500 hover:bg-blue-600"
                  onClick={handleConfirm}
                  disabled={!pendingOtp}
                >
                  Confirm Help
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Complaints Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold">{complaints.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {complaints.filter(c => c.status === "Pending").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {complaints.filter(c => c.status === "Resolved").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Student;
