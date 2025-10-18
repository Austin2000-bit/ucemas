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
import { Calendar, CheckCircle2, Clock, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getStudentOtp, verifyOTP, getComplaintsByUserId, supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { SystemLogs } from "@/utils/systemLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, StudentHelpConfirmation, StudentOtp } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmationWithHelper = StudentHelpConfirmation & { helperName?: string };

const Staff = () => {
  const { user } = useAuth();
  const staffId = user?.id || "";
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [todayConfirmed, setTodayConfirmed] = useState(false);
  const [recentConfirmations, setRecentConfirmations] = useState<ConfirmationWithHelper[]>([]);
  const [pendingOtp, setPendingOtp] = useState<StudentOtp | null>(null);
  const [assignedHelper, setAssignedHelper] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);
  const [isAllComplaintsModalOpen, setIsAllComplaintsModalOpen] = useState(false);
  
  const form = useForm({
    defaultValues: {
      otp: "",
    }
  });

  // Fetch initial data and set up subscriptions
  useEffect(() => {
    if (!staffId) return;

    const loadData = async () => {
      // Debug authentication
      console.log('=== STAFF AUTH DEBUG ===');
      console.log('Staff ID:', staffId);
      console.log('User object:', user);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth session:', session);
      console.log('Auth UID:', session?.user?.id);
      console.log('=== END STAFF AUTH DEBUG ===');

      // Get staff's confirmations
      const { data: confirmationsData, error: confirmationsError } = await supabase
        .from('student_help_confirmations')
        .select(`
          *,
          helper:helper_id (
            first_name,
            last_name
          )
        `)
        .eq('student_id', staffId)
        .order('created_at', { ascending: false });

      if (confirmationsError) {
        toast({ title: "Error", description: "Could not fetch recent confirmations." });
        console.error(confirmationsError);
      } else {
        const confirmations = (confirmationsData || []).map(c => ({
          ...c,
          helperName: c.helper ? `${c.helper.first_name} ${c.helper.last_name}` : 'Unknown Helper'
        }));
      setRecentConfirmations(confirmations);
      
        // Check for today's confirmation
        const today = new Date().toISOString().split('T')[0];
        const todayConfirm = confirmations.find(conf => conf.date === today && conf.status === 'confirmed');
        setTodayConfirmed(!!todayConfirm);
      }

      // Load assigned helper
      const { data, error } = await supabase
        .from('helper_student_assignments')
        .select('*, helper:helper_id(first_name, last_name)')
        .eq('student_id', staffId)
        .eq('status', 'active')
        .single();

      if (data) {
        setAssignedHelper({
          id: data.helper_id,
          first_name: data.helper.first_name,
          last_name: data.helper.last_name,
          email: data.helper.email,
          photo: data.helper.photo,
          role: 'helper' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setAssignedHelper(null);
      }
      
      // Fetch user complaints
      const userComplaints = await getComplaintsByUserId(staffId);
      setComplaints(userComplaints);
    };
    
    loadData();
    
    // Set up a real-time subscription to complaints with error handling
    let complaintSubscription: any = null;
    
    try {
      complaintSubscription = supabase
        .channel(`public:complaints:user_id=eq.${staffId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'complaints', filter: `user_id=eq.${staffId}` },
          (payload) => {
            console.log('Complaint change received!', payload);
            getComplaintsByUserId(staffId).then(setComplaints);
          }
        )
        .subscribe((status) => {
          console.log('Complaint subscription status:', status);
        });
    } catch (error) {
      console.error('Error setting up complaint subscription:', error);
    }

    // Cleanup subscription on component unmount
    return () => {
      if (complaintSubscription) {
        try {
          supabase.removeChannel(complaintSubscription);
        } catch (error) {
          console.error('Error removing complaint subscription:', error);
        }
      }
    };
  }, [staffId, user]);

  // Poll for new OTPs
  useEffect(() => {
    const pollOtp = async () => {
      if (!staffId || todayConfirmed) return;
      
      console.log('=== OTP POLLING DEBUG ===');
      console.log('Staff ID:', staffId);
      console.log('Today confirmed:', todayConfirmed);
      console.log('Polling for new OTP...');
      
      const staffOtp = await getStudentOtp(staffId);
      console.log('Polled OTP result:', staffOtp);
      
      if (staffOtp && (!pendingOtp || staffOtp.timestamp !== pendingOtp.timestamp)) {
        console.log('New OTP detected:', staffOtp);
        setPendingOtp(staffOtp);
        form.setValue("otp", staffOtp.otp);
        
        toast({
          title: "New OTP Received",
          description: `Helper ${staffOtp.helperName} has sent you a verification code.`,
        });
      } else {
        console.log('No new OTP found or OTP already pending');
      }
      console.log('=== END OTP POLLING DEBUG ===');
    };
    
    const interval = setInterval(pollOtp, 10000);
    
    return () => clearInterval(interval);
  }, [staffId, todayConfirmed, pendingOtp, form]);
  
  useEffect(() => {
    // Fetch user profile from Supabase
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setUserProfile(data);
      else setUserProfile(null);
    };
    fetchProfile();
  }, [user?.id]);
  
  const handleConfirm = async () => {
    const otpValue = form.getValues("otp");
    if (!otpValue || otpValue.length < 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
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

    // Immediately clear pending OTP to allow for re-fetching
    const otpToVerify = pendingOtp;
    setPendingOtp(null);

    try {
      // Verify OTP using the Supabase function
      const result = await verifyOTP(otpToVerify.sessionId, otpValue);
      
      if (!result.success) {
      toast({
          title: "OTP Verification Failed",
          description: result.error?.message || "Failed to verify OTP",
        variant: "destructive",
      });
        // Restore the OTP if verification fails so the user can retry
        setPendingOtp(otpToVerify);
      return;
    }
    
      // Update state on success
      setTodayConfirmed(true);
      
      // Refresh confirmations
      const { data: confirmationsData, error: confirmationsError } = await supabase
        .from('student_help_confirmations')
        .select(`
          *,
          helper:helper_id (
            first_name,
            last_name
          )
        `)
        .eq('student_id', staffId)
        .order('created_at', { ascending: false });
        
      if (!confirmationsError && confirmationsData) {
        const confirmations = confirmationsData.map(c => ({
          ...c,
          helperName: c.helper ? `${c.helper.first_name} ${c.helper.last_name}` : 'Unknown Helper'
        }));
        setRecentConfirmations(confirmations);
      }
    
    // Log the confirmation
    SystemLogs.addLog(
      "Help confirmed",
        `Staff ${user?.first_name} ${user?.last_name} confirmed help from helper ${otpToVerify.helperName}`,
      staffId,
      "staff"
    );
    
    toast({
      title: "Help confirmed",
      description: "Thank you for confirming the Assistance provision.",
    });
    
    form.reset();
    } catch (error) {
      console.error('Error confirming help:', error);
      toast({
        title: "Error",
        description: "Failed to confirm Assistance. Please try again.",
        variant: "destructive",
      });
      // Restore the OTP on error
      setPendingOtp(otpToVerify);
    }
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
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">ASSISTANCE CONFIRMATION</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-blue-500 dark:text-blue-400">Daily confirmation</span>
          </div>
          
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold mb-2">Recent Confirmations</h3>
            {recentConfirmations.length > 0 ? (
              <div className="max-h-60 overflow-y-auto pr-2">
                <ul className="space-y-3">
                  {recentConfirmations.map((conf) => (
                    <li key={conf.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">
                            Confirmed on {conf.date}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Helper: {conf.helperName}
                          </p>
                    </div>
                  </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(conf.created_at).toLocaleTimeString()}
                      </span>
                    </li>
                ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No recent confirmations
              </p>
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
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Assigned Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedHelper ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={assignedHelper.photo || "/default-avatar.png"} />
                    <AvatarFallback>
                      {assignedHelper.first_name[0]}{assignedHelper.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {assignedHelper.first_name} {assignedHelper.last_name}
                    </h3>
                    <p className="text-muted-foreground">{assignedHelper.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available for assistance during working hours
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No assigned Assistant yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - User Profile and OTP */}
        <div className="flex-1 p-6 dark:text-white">
          <div className="flex justify-between mb-8">
            <h2 className="text-lg text-gray-500 dark:text-gray-400">confirm Assistance provision</h2>
          </div>
          
          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32 mb-4">
              <AvatarImage src={userProfile?.photo || "/default-avatar.png"} alt={`${userProfile?.first_name} ${userProfile?.last_name}`} />
              <AvatarFallback>{userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}</AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-100">
              {userProfile?.first_name?.toUpperCase()} {userProfile?.last_name?.toUpperCase()}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Any dishonesty will not be forgiven</p>
            
            <div className="flex items-center gap-2 mb-6">
              <span className="font-medium">{currentDate}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {todayConfirmed 
                  ? "You've confirmed Assistance for today" 
                  : "confirm if your Assistant has assisted you today"}
              </span>
            </div>
            
            {pendingOtp && !todayConfirmed && (
              <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20 w-full max-w-md">
                <Clock className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700 dark:text-blue-400">New OTP Received</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-300">
                  Assistant {pendingOtp.helperName} has sent you a verification code at {formatTime(pendingOtp.timestamp)}. 
                  The code has been automatically filled in for you.
                </AlertDescription>
                {pendingOtp.description && (
                  <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-md">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Assistance Description:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {pendingOtp.description}
                    </p>
                  </div>
                )}
              </Alert>
            )}
            
            {todayConfirmed ? (
              <div className="flex flex-col items-center justify-center mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg w-full max-w-xs">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-center text-green-700 dark:text-green-400">
                  Assistance confirmed for today
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
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup className="gap-4">
                              <InputOTPSlot index={0} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={1} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={2} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={3} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={4} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={5} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
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
                      ? "OTP automatically filled from Assistant" 
                      : "Enter OTP provided by Assistant"}
                  </span>
                </div>
                
                <Button 
                  className="w-full max-w-xs bg-blue-500 hover:bg-blue-600"
                  onClick={handleConfirm}
                >
                  Confirm Assistance
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
              <CardTitle>Your Recent Complaints</CardTitle>
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
                      {complaints.filter(c => c.status === "pending").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {complaints.filter(c => c.status === "resolved").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                </div>
                
                {/* Complaints List */}
                {complaints.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Complaints</h4>
                    {complaints.slice(0, 3).map((complaint) => (
                      <div key={complaint.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{complaint.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(complaint.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              complaint.status === "resolved" ? "default" : 
                              complaint.status === "in_progress" ? "secondary" : 
                              "outline"
                            }
                            className="text-xs"
                          >
                            {complaint.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {complaint.description}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setIsComplaintDialogOpen(true);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    ))}
                    {complaints.length > 3 && (
                      <div className="text-center">
                        <Button variant="outline" size="sm" onClick={() => setIsAllComplaintsModalOpen(true)}>
                          View All Complaints
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complaint Detail Dialog */}
      {selectedComplaint && (
        <Dialog open={isComplaintDialogOpen} onOpenChange={setIsComplaintDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complaint Details</DialogTitle>
              <DialogDescription>
                Submitted on {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleDateString() : 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium mb-1">Category</p>
                <p className="text-sm">{selectedComplaint.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <p className="text-sm">
                  <Badge 
                    variant={
                      selectedComplaint.status === "resolved" ? "default" : 
                      selectedComplaint.status === "in_progress" ? "secondary" : 
                      "outline"
                    }
                  >
                    {selectedComplaint.status.replace('_', ' ')}
                  </Badge>
                </p>
              </div>
              {selectedComplaint.feedback && (
                <div>
                  <p className="text-sm font-medium mb-1">Admin Feedback</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedComplaint.feedback}
                  </p>
                </div>
              )}
              {selectedComplaint.follow_up && (
                <div>
                  <p className="text-sm font-medium mb-1">Follow-up Information</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedComplaint.follow_up}
                  </p>
                </div>
              )}
              {!selectedComplaint.feedback && !selectedComplaint.follow_up && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No admin response yet. Your complaint is being reviewed.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* All Complaints Modal */}
      {isAllComplaintsModalOpen && (
        <Dialog open={isAllComplaintsModalOpen} onOpenChange={setIsAllComplaintsModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>All Your Complaints</DialogTitle>
              <DialogDescription>
                A complete list of all complaints you have submitted.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{complaint.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        complaint.status === "resolved" ? "default" : 
                        complaint.status === "in_progress" ? "secondary" : 
                        "outline"
                      }
                      className="text-xs"
                    >
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {complaint.description}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedComplaint(complaint);
                      setIsComplaintDialogOpen(true);
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsAllComplaintsModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Staff;
