import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clipboard, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAuth } from "@/utils/auth";
import { supabase } from "@/lib/supabase";
import { User, SignInRecord, HelpConfirmation } from "@/types";

const Helper = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isSigned, setIsSigned] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [signInHistory, setSignInHistory] = useState<SignInRecord[]>([]);
  const [confirmations, setConfirmations] = useState<HelpConfirmation[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let isSubscribed = true;
    const POLL_INTERVAL = 60000; // Increased to 60 seconds

    const loadData = async () => {
      if (!user?.id || !isSubscribed) return;
      
      try {
        setIsLoading(true);
        
        // Use a single query to fetch all required data
        const [assignmentsResponse, signInResponse, confirmationsResponse] = await Promise.all([
          // Fetch assignments
          supabase
            .from('helper_student_assignments')
            .select(`
              id,
              student:student_id (
                id,
                first_name,
                last_name,
                email,
                role,
                created_at,
                updated_at
              )
            `)
            .eq('helper_id', user.id)
            .eq('status', 'active'),
            
          // Check today's sign in
          supabase
            .from('helper_sign_ins')
            .select('*')
            .eq('helper_id', user.id)
            .eq('date', new Date().toISOString().split('T')[0])
            .single(),
            
          // Fetch recent confirmations
          supabase
            .from('student_help_confirmations')
            .select('*')
            .eq('helper_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        if (assignmentsResponse.error) throw assignmentsResponse.error;
        
        // Process assignments with proper typing
        const myStudents = (assignmentsResponse.data || [])
          .map(a => ({
            id: a.student.id,
            first_name: a.student.first_name,
            last_name: a.student.last_name,
            email: a.student.email,
            role: a.student.role,
            created_at: a.student.created_at,
            updated_at: a.student.updated_at
          } as User))
          .filter((student): student is User => !!student);
          
        if (isSubscribed) {
          setAssignedStudents(myStudents);
          
          // Auto-select single student
          if (myStudents.length === 1 && !selectedStudent && myStudents[0]) {
            setSelectedStudent(myStudents[0].id);
          }
          
          // Update sign in status
          setIsSigned(!!signInResponse.data);
          
          // Update confirmations
          setConfirmations(confirmationsResponse.data || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (isSubscribed) {
          toast({
            title: "Error",
            description: "Failed to load data. Please refresh the page.",
            variant: "destructive",
          });
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    // Setup polling with increased interval
    const pollInterval = setInterval(loadData, POLL_INTERVAL);
    
    // Cleanup function
    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [user?.id, selectedStudent]); // Only re-run when user ID or selected student changes

  const generateOTP = async () => {
    if (!user?.id || !selectedStudent) return;
    
    try {
      // First create a session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          helper_id: user.id,
          student_id: selectedStudent,
          status: 'pending_confirmation',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Generate OTP using the Edge Function
      const { data, error: otpError } = await supabase.functions.invoke('generate-otp', {
        body: { sessionId: session.id }
      });

      if (otpError || !data?.otp) {
        throw new Error(otpError?.message || 'Failed to generate OTP');
      }

      // Set the OTP in state for display
      setOtp(data.otp);
      
      // Get the selected student's name for the toast
      const selectedStudentData = assignedStudents.find(s => s.id === selectedStudent);
      if (selectedStudentData) {
        toast({
          title: "OTP Generated",
          description: `OTP has been sent to ${selectedStudentData.first_name} ${selectedStudentData.last_name}`,
        });
      }

      setHasCopied(false);
    } catch (error) {
      console.error('Error generating OTP:', error);
      toast({
        title: "Error",
        description: "Failed to generate OTP",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already signed in
      const { data: existingSignIn } = await supabase
        .from('helper_sign_ins')
        .select('*')
        .eq('helper_id', user.id)
        .eq('date', today)
        .single();

      if (existingSignIn) {
        toast({
          title: "Already signed in",
          description: "You have already signed in for today.",
        });
        return;
      }

      // Create new sign in record
      const { error: signInError } = await supabase
        .from('helper_sign_ins')
        .insert([{
          helper_id: user.id,
          date: today
        }]);

      if (signInError) throw signInError;

      setIsSigned(true);
      toast({
        title: "Signed in successfully",
        description: "You have successfully signed in for today.",
      });
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Error",
        description: "Failed to sign in",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !description.trim() || !user?.id) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create help confirmation first
      console.log('Creating help confirmation...');
      const { error: confirmationError } = await supabase
        .from('student_help_confirmations')
        .insert({
          helper_id: user.id,
          student_id: selectedStudent,
          description: description.trim(),
          date: new Date().toISOString().split('T')[0],
          status: 'pending'
        });

      if (confirmationError) {
        console.error('Help confirmation error:', confirmationError);
        throw new Error(`Failed to create help confirmation: ${confirmationError.message}`);
      }

      // Generate a simple 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create a session with the OTP
      console.log('Creating session with OTP...');
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          helper_id: user.id,
          student_id: selectedStudent,
          otp: otp,
          otp_expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
          status: 'pending_confirmation'
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      // Set the OTP in state for display
      setOtp(otp);
      
      // Get the selected student's name for the toast
      const selectedStudentData = assignedStudents.find(s => s.id === selectedStudent);
      if (selectedStudentData) {
        toast({
          title: "Help Confirmation Created",
          description: `OTP has been generated for ${selectedStudentData.first_name} ${selectedStudentData.last_name}`,
        });
      }

      setDescription("");
      setHasCopied(false);
    } catch (error) {
      console.error('Error submitting help confirmation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit help confirmation",
        variant: "destructive",
      });
    }
  };

  const getStudentName = (studentId: string) => {
    const student = assignedStudents.find(s => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <div className="flex flex-col md:flex-row flex-grow">
        <div className="md:w-1/3 bg-gray-300 dark:bg-gray-800 p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">HELP CONFIRMATION</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-blue-500 dark:text-blue-400">Daily confirmation</span>
          </div>
          
          <div className="max-w-md w-full mx-auto mb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src="/undraw_business-deal_nx2n.png" 
                  alt="Devices illustration" 
                  className="w-60 h-40 object-contain rounded-full"
                />
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Select 
                  value={selectedStudent} 
                  onValueChange={setSelectedStudent}
                  disabled={assignedStudents.length === 1}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assigned student" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignedStudents.length === 0 && (
                  <p className="text-sm text-amber-500">
                    No students assigned to you yet. Please contact an administrator.
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Briefly describe help provided..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full resize-none"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={assignedStudents.length === 0}
              >
                Sign & Generate OTP
              </Button>
            </form>

            {otp && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex flex-col items-center">
                  <h3 className="font-medium mb-2">
                    OTP for {getStudentName(selectedStudent)}
                  </h3>
                  <div className="flex items-center gap-3 my-2">
                    <Badge variant="outline" className="text-2xl py-3 px-6 font-mono">
                      {otp}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        navigator.clipboard.writeText(otp);
                        setHasCopied(true);
                        toast({
                          title: "OTP Copied",
                          description: "OTP has been copied to clipboard.",
                        });
                      }}
                      className="flex items-center gap-1"
                    >
                      {hasCopied ? <CheckCircle className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                      {hasCopied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Share this OTP with the student to verify help provision
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={generateOTP}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Generate new OTP
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col dark:text-white overflow-y-auto">
          <h1 className="text-xl font-medium mb-4 text-center">Recent Help Confirmations</h1>
          
          <div className="w-full mt-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableCaption>A list of recent help provisions</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmations.length > 0 ? (
                      confirmations
                        .filter(conf => conf.helper === user?.id)
                        .slice(-10)
                        .reverse()
                        .map((conf, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{formatDate(conf.date)}</TableCell>
                          <TableCell>{getStudentName(conf.student)}</TableCell>
                          <TableCell className="max-w-xs truncate">{conf.description}</TableCell>
                          <TableCell>
                            {(() => {
                              const studentConfirmations = JSON.parse(localStorage.getItem('studentHelpConfirmations') || '[]');
                              const isConfirmed = studentConfirmations.some(
                                (sc: any) => sc.date === conf.date && sc.helperId === conf.helper && sc.student === conf.student
                              );
                              return isConfirmed ? (
                                <Badge className="bg-green-500">Verified</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          No confirmations recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Helper;
