import { useState, useEffect } from "react";
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
  const { user } = useAuth();

  useEffect(() => {
    // Load assigned students and helper data
    const loadData = async () => {
      if (!user) return;

      try {
        // Get assigned students from database
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('helper_student_assignments')
          .select(`
            *,
            student:users!student_id(*)
          `)
          .eq('helper_id', user.id)
          .eq('status', 'active');

        if (assignmentsError) throw assignmentsError;

        const myStudents = assignmentsData?.map(a => a.student) || [];
        setAssignedStudents(myStudents);

        // Check if already signed in today
        const today = new Date().toISOString().split('T')[0];
        const { data: signInData, error: signInError } = await supabase
          .from('helper_sign_ins')
          .select('*')
          .eq('date', today)
          .eq('helper', user.id)
          .maybeSingle();

        if (signInError) throw signInError;
        
        setIsSigned(!!signInData);
        
        // Load sign in history
        const { data: signInHistory, error: historyError } = await supabase
          .from('helper_sign_ins')
          .select('*')
          .eq('helper', user.id)
          .order('timestamp', { ascending: false });
          
        if (historyError) throw historyError;
        
        setSignInHistory(signInHistory || []);
        
        // Load help confirmations
        const { data: confirmationsData, error: confirmationsError } = await supabase
          .from('student_help_confirmations')
          .select('*')
          .eq('helper_id', user.id)
          .order('timestamp', { ascending: false });
          
        if (confirmationsError) throw confirmationsError;
        
        setConfirmations(confirmationsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [user]);

  const generateOTP = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    // Generate a 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(newOtp);
    
    // Get the selected student's information
    const selectedStudentData = assignedStudents.find(s => s.id === selectedStudent);
    
    try {
      // First, delete any existing OTP for this student
      await supabase
        .from('student_otps')
        .delete()
        .eq('studentId', selectedStudent);
      
      // Then save new OTP in the database
      const { error } = await supabase
        .from('student_otps')
        .insert({
          otp: newOtp,
          timestamp: Date.now(),
          helperName: `${user.firstName} ${user.lastName}`,
          studentId: selectedStudent
        });
        
      if (error) throw error;
      
      toast({
        title: "OTP Generated",
        description: `OTP has been sent to ${selectedStudentData?.first_name} ${selectedStudentData?.last_name}`,
      });
      
      setHasCopied(false);
    } catch (error) {
      console.error('Error saving OTP:', error);
      toast({
        title: "Error",
        description: "Failed to generate OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check if already signed in today
      const { data: existingSignIn, error: checkError } = await supabase
        .from('helper_sign_ins')
        .select('*')
        .eq('date', today)
        .eq('helper', user.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingSignIn) {
        toast({
          title: "Already signed in",
          description: "You have already signed in for today.",
        });
        return;
      }
      
      // Create new sign in record
      const { error } = await supabase
        .from('helper_sign_ins')
        .insert({
          date: today,
          helper: user.id,
          timestamp: Date.now()
        });
        
      if (error) throw error;
      
      setIsSigned(true);
      
      // Refresh sign in history
      const { data: updatedHistory, error: historyError } = await supabase
        .from('helper_sign_ins')
        .select('*')
        .eq('helper', user.id)
        .order('timestamp', { ascending: false });
        
      if (historyError) throw historyError;
      
      setSignInHistory(updatedHistory || []);
      
      toast({
        title: "Signed in successfully",
        description: "You have successfully signed in for today.",
      });
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedStudent) {
      toast({
        title: "Student selection required",
        description: "Please select an assigned student",
        variant: "destructive",
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please briefly describe help provided",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Insert help confirmation
      const { error } = await supabase
        .from('student_help_confirmations')
        .insert({
          date: today,
          helper_id: user.id,
          student_id: selectedStudent,
          description: description,
          status: 'pending',
          timestamp: Date.now()
        });
        
      if (error) throw error;
      
      // Generate OTP for student verification
      await generateOTP();
      
      // Refresh confirmations list
      const { data: updatedConfirmations, error: fetchError } = await supabase
        .from('student_help_confirmations')
        .select('*')
        .eq('helper_id', user.id)
        .order('timestamp', { ascending: false });
        
      if (fetchError) throw fetchError;
      
      setConfirmations(updatedConfirmations || []);
      
      toast({
        title: "Help confirmation submitted",
        description: "Thank you for confirming the help provision.",
      });
      
      setDescription("");
    } catch (error) {
      console.error('Error submitting help confirmation:', error);
      toast({
        title: "Error",
        description: "Failed to submit help confirmation. Please try again.",
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
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
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
              
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
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
                      confirmations.slice(-10).reverse().map((conf, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{formatDate(conf.date)}</TableCell>
                          <TableCell>{getStudentName(conf.student)}</TableCell>
                          <TableCell className="max-w-xs truncate">{conf.description}</TableCell>
                          <TableCell>
                            {(() => {
                              const studentConfirmations = JSON.parse(localStorage.getItem('studentHelpConfirmations') || '[]');
                              const isConfirmed = studentConfirmations.some(
                                (sc: any) => sc.date === conf.date && sc.helperId === conf.student
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
