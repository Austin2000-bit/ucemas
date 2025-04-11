
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

interface SignInRecord {
  date: string;
  helper: string;
  timestamp: number;
}

interface HelpConfirmation {
  date: string;
  helper: string;
  student: string;
  description: string;
  timestamp: number;
}

const Helper = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isSigned, setIsSigned] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [signInHistory, setSignInHistory] = useState<SignInRecord[]>([]);
  const [confirmations, setConfirmations] = useState<HelpConfirmation[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedSignIns = localStorage.getItem('helperSignIns');
    const signIns: SignInRecord[] = storedSignIns ? JSON.parse(storedSignIns) : [];
    
    const signedToday = signIns.some(record => 
      record.date === today && 
      record.helper === "amanda"
    );
    
    setIsSigned(signedToday);
    setSignInHistory(signIns);

    const storedConfirmations = localStorage.getItem('helpConfirmations');
    const helpConfirmations: HelpConfirmation[] = storedConfirmations 
      ? JSON.parse(storedConfirmations) 
      : [];
    setConfirmations(helpConfirmations);
  }, []);

  const generateOTP = () => {
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setOtp(newOtp);
    
    // Store OTP in localStorage with student info
    localStorage.setItem('currentHelperOTP', newOtp);
    localStorage.setItem('currentHelperId', selectedStudent);
    
    // Store OTP with student ID to make it available to the student page
    const studentOtps = JSON.parse(localStorage.getItem('studentOtps') || '{}');
    studentOtps[selectedStudent] = {
      otp: newOtp,
      timestamp: Date.now(),
      helperName: "Amanda Kusisqanya"
    };
    localStorage.setItem('studentOtps', JSON.stringify(studentOtps));
    
    toast({
      title: "OTP Generated",
      description: `OTP for ${getStudentName(selectedStudent)} has been generated and shared.`,
    });
    
    setHasCopied(false);
  };

  const copyOTP = () => {
    navigator.clipboard.writeText(otp);
    setHasCopied(true);
    toast({
      title: "OTP Copied",
      description: "OTP has been copied to clipboard.",
    });
  };

  const handleSignIn = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const storedSignIns = localStorage.getItem('helperSignIns');
    const signIns: SignInRecord[] = storedSignIns ? JSON.parse(storedSignIns) : [];
    
    const signedToday = signIns.some(record => 
      record.date === today && 
      record.helper === "amanda"
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
      helper: "amanda",
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

    const today = new Date().toISOString().split('T')[0];
    const storedConfirmations = localStorage.getItem('helpConfirmations');
    const helpConfirmations: HelpConfirmation[] = storedConfirmations 
      ? JSON.parse(storedConfirmations) 
      : [];
    
    const newConfirmation: HelpConfirmation = {
      date: today,
      helper: "amanda",
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
    const studentMap: {[key: string]: string} = {
      'john': 'John Smith',
      'maria': 'Maria Garcia',
      'james': 'James Johnson',
      'sarah': 'Sarah Williams',
    };
    
    return studentMap[studentId] || 'Unknown Student';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <div className="flex flex-col md:flex-row flex-grow">
        <div className="md:w-1/3 bg-blue-400 dark:bg-blue-600 p-6 flex flex-col items-center">
          <div className="rounded-full overflow-hidden w-32 h-32 border-4 border-white mb-4">
            <img 
              src="/lovable-uploads/4099645c-e8d9-40ed-9964-383c8452c070.png" 
              alt="Amanda Kusisqanya" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-white font-semibold text-xl mb-1">AMANDA KUSISQANYA</h2>
          <p className="text-white/80 mb-6">Special Needs Assistant</p>
          
          <Button 
            variant="outline" 
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 w-full mb-4"
            onClick={handleSignIn}
            disabled={isSigned}
          >
            {isSigned ? "Signed in for today" : "Daily sign-in"}
          </Button>

          <div className="w-full mt-4 bg-white/10 p-4 rounded-md">
            <h3 className="text-white font-medium mb-2">Recent Sign-ins</h3>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {signInHistory.slice(-5).reverse().map((record, idx) => (
                  <div key={idx} className="text-white/90 text-sm flex justify-between">
                    <span>{formatDate(record.date)}</span>
                    <span>{new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col dark:text-white overflow-y-auto">
          <h1 className="text-xl font-medium mb-4 text-center">Sign to confirm help provision</h1>
          
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
                    <SelectItem value="john">John Smith</SelectItem>
                    <SelectItem value="maria">Maria Garcia</SelectItem>
                    <SelectItem value="james">James Johnson</SelectItem>
                    <SelectItem value="sarah">Sarah Williams</SelectItem>
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
                      onClick={copyOTP}
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

          <div className="w-full mt-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-medium mb-3">Recent Help Confirmations</h2>
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
