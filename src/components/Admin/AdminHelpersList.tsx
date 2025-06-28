
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Check, MessageSquare, Eye } from "lucide-react";

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

interface StudentConfirmation {
  date: string;
  helperId: string;
}

interface AdminHelpersListProps {
  view: "helpers" | "students";
}

const AdminHelpersList = ({ view }: AdminHelpersListProps) => {
  const [signIns, setSignIns] = useState<SignInRecord[]>([]);
  const [helpConfirmations, setHelpConfirmations] = useState<HelpConfirmation[]>([]);
  const [studentConfirmations, setStudentConfirmations] = useState<StudentConfirmation[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<HelpConfirmation | null>(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  
  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      const storedSignIns = localStorage.getItem('helperSignIns');
      const signInData: SignInRecord[] = storedSignIns ? JSON.parse(storedSignIns) : [];
      setSignIns(signInData);
      
      const storedConfirmations = localStorage.getItem('helpConfirmations');
      const confirmationData: HelpConfirmation[] = storedConfirmations 
        ? JSON.parse(storedConfirmations) 
        : [];
      setHelpConfirmations(confirmationData);
      
      const storedStudentConfirmations = localStorage.getItem('studentHelpConfirmations');
      const studentConfirmationData: StudentConfirmation[] = storedStudentConfirmations 
        ? JSON.parse(storedStudentConfirmations) 
        : [];
      setStudentConfirmations(studentConfirmationData);
    };
    
    loadData();
  }, []);
  
  const showDetails = (confirmation: HelpConfirmation) => {
    setDetailsData(confirmation);
    setIsDetailsOpen(true);
  };
  
  const openMessageDialog = (recipient: string) => {
    setMessageRecipient(recipient);
    setIsMessageOpen(true);
  };
  
  const sendMessage = () => {
    if (!messageSubject.trim() || !messageContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both subject and message content",
        variant: "destructive",
      });
      return;
    }
    
    // Save message to localStorage
    const storedMessages = localStorage.getItem('adminMessages') || '[]';
    const messages = JSON.parse(storedMessages);
    
    messages.push({
      recipient: messageRecipient,
      subject: messageSubject,
      content: messageContent,
      timestamp: Date.now(),
      read: false
    });
    
    localStorage.setItem('adminMessages', JSON.stringify(messages));
    
    toast({
      title: "Message sent",
      description: `Your message has been sent to ${getDisplayName(messageRecipient)}`,
    });
    
    // Reset form
    setIsMessageOpen(false);
    setMessageSubject("");
    setMessageContent("");
  };
  
  // Helper function to get display names
  const getDisplayName = (id: string) => {
    const nameMap: { [key: string]: string } = {
      'amanda': 'Amanda Kusisqanya',
      'john': 'John Smith',
      'maria': 'Maria Garcia',
      'james': 'James Johnson',
      'sarah': 'Sarah Williams',
    };
    
    return nameMap[id] || id;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Filter data based on current view
  const filteredSignIns = signIns.filter(record => 
    view === "helpers" ? true : false
  );
  
  const filteredConfirmations = helpConfirmations.filter(record => 
    view === "helpers" ? true : 
    view === "students" ? true : false
  );
  
  // Check if a confirmation is verified by student
  const isConfirmed = (conf: HelpConfirmation) => {
    return studentConfirmations.some(
      sc => sc.date === conf.date && sc.helperId === conf.student
    );
  };
  
  return (
    <>
      {/* Main table */}
      {view === "helpers" && (
        <>
          <h2 className="text-lg font-medium mb-3">Helper Sign-ins</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <Table>
              <TableCaption>Recent helper sign-ins</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Helper</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignIns.length > 0 ? (
                  filteredSignIns
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10)
                    .map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{getDisplayName(record.helper)}</TableCell>
                        <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openMessageDialog(record.helper)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No sign-in records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      
      <h2 className="text-lg font-medium mb-3">Help Confirmations</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <Table>
          <TableCaption>Recent help confirmations</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>{view === "helpers" ? "Helper" : "Student"}</TableHead>
              <TableHead>{view === "helpers" ? "Student" : "Helper"}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConfirmations.length > 0 ? (
              filteredConfirmations
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map((record, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{view === "helpers" ? getDisplayName(record.helper) : getDisplayName(record.student)}</TableCell>
                    <TableCell>{view === "helpers" ? getDisplayName(record.student) : getDisplayName(record.helper)}</TableCell>
                    <TableCell>
                      {isConfirmed(record) ? (
                        <Badge className="bg-green-500">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => showDetails(record)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openMessageDialog(view === "helpers" ? record.helper : record.student)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  No confirmation records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help Confirmation Details</DialogTitle>
            <DialogDescription>
              View the full details of this help confirmation
            </DialogDescription>
          </DialogHeader>
          
          {detailsData && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(detailsData.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{new Date(detailsData.timestamp).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Helper</p>
                  <p className="font-medium">{getDisplayName(detailsData.helper)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student</p>
                  <p className="font-medium">{getDisplayName(detailsData.student)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    {isConfirmed(detailsData) ? (
                      <Badge className="bg-green-500">Verified by Student</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">Pending Verification</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                  {detailsData.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Message dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to {getDisplayName(messageRecipient)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Subject</p>
              <Input 
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Enter message subject"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Message</p>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                rows={5}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsMessageOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendMessage}>
                <Check className="h-4 w-4 mr-1" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminHelpersList;