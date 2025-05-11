
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
    // Load assigned students
    const loadData = () => {
      const assignments = JSON.parse(localStorage.getItem("helperStudentAssignments") || "[]");
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      const myAssignments = assignments.filter((a: any) => a.helper_id === user?.id && a.status === "active");
      const myStudents = myAssignments.map((a: any) => {
        const student = users.find((u: any) => u.id === a.student_id);
        return student;
      }).filter(Boolean);
      
      setAssignedStudents(myStudents);
      
      // If there's only one assigned student, select them automatically
      if (myStudents.length === 1 && !selectedStudent) {
        setSelectedStudent(myStudents[0].id);
      }

      const today = new Date().toISOString().split('T')[0];
      const storedSignIns = localStorage.getItem('helperSignIns');
      const signIns: SignInRecord[] = storedSignIns ? JSON.parse(storedSignIns) : [];
      
      const signedToday = signIns.some(record => 
        record.date === today && 
        record.helper === user?.id
      );
      
      setIsSigned(signedToday);
      setSignInHistory(signIns);

      const storedConfirmations = localStorage.getItem('helpConfirmations');
      const helpConfirmations: HelpConfirmation[] = storedConfirmations 
        ? JSON.parse(storedConfirmations) 
        : [];
      setConfirmations(helpConfirmations);
    };

    loadData();
    
    // Setup periodic refresh
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user, selectedStudent]);

  const generateOTP = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 4);
    setOtp(newOtp);
    
    // Get the selected student's email
    const selectedStudentData = assignedStudents.find(s => s.id === selectedStudent);
    if (!selectedStudentData) {
      toast({
        title: "Error",
        description: "Could not find selected student's information",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    
    // Store OTP in localStorage with student's email
    const otps = JSON.parse(localStorage.getItem("otps") || "[]");
    const newOtpEntry = {
      code: newOtp,
      email: selectedStudentData.email,
      timestamp: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      helperId: user.id,
      helperName: `${user.first_name} ${user.last_name}`,
      studentId: selectedStudent,
      otp: newOtp
    };
    otps.push(newOtpEntry);
    
    localStorage.setItem("otps", JSON.stringify(otps));
    
    // Store in studentOtps for the student to access
    const studentOtps = JSON.parse(localStorage.getItem("studentOtps") || "[]");
    studentOtps.push(newOtpEntry);
    localStorage.setItem("studentOtps", JSON.stringify(studentOtps));
    
    // Trigger a custom event to notify the student's page
    const event = new CustomEvent('newOtpGenerated', { detail: newOtpEntry });
    window.dispatchEvent(event);
    
    toast({
      title: "OTP Generated",
      description: `OTP has been sent to ${selectedStudentData.first_name} ${selectedStudentData.last_name}`,
    });

    setHasCopied(false);
  };

  const handleSignIn = () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    const storedSignIns = localStorage.getItem('helperSignIns');
    const signIns: SignInRecord[] = storedSignIns ? JSON.parse(storedSignIns) : [];
    
    const signedToday = signIns.some(record => 
      record.date === today && 
      record.helper === user.id
    );
    
    if (signedToday) {
      toast({
        title: "Already signed in",
        description: "You have already signed in for today.",
      });
      return;
    }
    
    const newSignIn: SignInRecord = {
      date: today,
      helper: user.id,
      timestamp: Date.now()
    };
    
    signIns.push(newSignIn);
    localStorage.setItem('helperSignIns', JSON.stringify(signIns));
    
    setIsSigned(true);
    setSignInHistory(signIns);
    
    toast({
      title: "Signed in successfully",
      description: "You have successfully signed in for today.",
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const storedConfirmations = localStorage.getItem('helpConfirmations');
    const helpConfirmations: HelpConfirmation[] = storedConfirmations 
      ? JSON.parse(storedConfirmations) 
      : [];
    
    const newConfirmation: HelpConfirmation = {
      date: today,
      helper: user.id,
      student: selectedStudent,
      description: description,
      timestamp: Date.now()
    };
    
    helpConfirmations.push(newConfirmation);
    localStorage.setItem('helpConfirmations', JSON.stringify(helpConfirmations));
    setConfirmations(helpConfirmations);
    
    generateOTP();
    
    toast({
      title: "Help confirmation submitted",
      description: "Thank you for confirming the help provision.",
    });
    
    setDescription("");
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
