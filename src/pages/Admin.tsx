
import { useState, useEffect } from "react";
import { LayoutDashboard, Users, HelpingHand, FileText, Car, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AdminHelpersList from "@/components/admin/AdminHelpersList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

// Define complaint type
interface Complaint {
  id: string;
  name: string;
  email: string;
  issueCategory: string;
  description: string;
  created: string;
  status: string;
  feedback: string;
  followUp: string;
}

const Admin = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [status, setStatus] = useState("");
  const [messageRecipient, setMessageRecipient] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  // Navigation items for the sidebar
  const sidebarItems = [
    { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, url: "/admin" },
    { id: "students", title: "Manage Students", icon: Users, url: "/admin/students" },
    { id: "helpers", title: "Manage Helpers", icon: HelpingHand, url: "/admin/helpers" },
    { id: "complaints", title: "View complaints", icon: FileText, url: "/admin/complaints" },
    { id: "rides", title: "Ride requests", icon: Car, url: "/admin/rides" },
    { id: "reports", title: "Reports", icon: PieChart, url: "/admin/reports" },
  ];
  
  // Load complaints from localStorage
  useEffect(() => {
    if (activeSection === "complaints") {
      const storedComplaints = JSON.parse(localStorage.getItem("complaints") || "[]");
      setComplaints(storedComplaints);
    }
  }, [activeSection]);

  // Handle opening complaint dialog
  const handleOpenComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setFeedback(complaint.feedback || "");
    setFollowUp(complaint.followUp || "");
    setStatus(complaint.status || "Pending");
    setIsDialogOpen(true);
  };

  // Handle saving complaint updates
  const handleSaveComplaint = () => {
    if (!selectedComplaint) return;

    const updatedComplaints = complaints.map(complaint => 
      complaint.id === selectedComplaint.id 
        ? { 
            ...complaint, 
            status, 
            feedback, 
            followUp 
          } 
        : complaint
    );

    localStorage.setItem("complaints", JSON.stringify(updatedComplaints));
    setComplaints(updatedComplaints);
    setIsDialogOpen(false);
    
    toast({
      title: "Complaint updated",
      description: `Complaint ${selectedComplaint.id} has been updated.`,
    });
  };

  // Handle opening message dialog
  const handleOpenMessageDialog = (recipient: string) => {
    setMessageRecipient(recipient);
    setMessageText("");
    setIsMessageDialogOpen(true);
  };

  // Handle sending message
  const handleSendMessage = () => {
    if (!messageText.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    // Get existing messages or initialize new array
    const existingMessages = JSON.parse(localStorage.getItem("adminMessages") || "{}");
    
    // Add message to recipient's array
    if (!existingMessages[messageRecipient]) {
      existingMessages[messageRecipient] = [];
    }
    
    existingMessages[messageRecipient].push({
      id: Date.now(),
      text: messageText,
      timestamp: new Date().toISOString(),
      read: false,
    });
    
    localStorage.setItem("adminMessages", JSON.stringify(existingMessages));
    
    toast({
      title: "Message sent",
      description: `Message has been sent to ${messageRecipient}.`,
    });
    
    setIsMessageDialogOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "helpers":
      case "students":
        return <AdminHelpersList view={activeSection} />;
      case "complaints":
        return (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Complaints Management</h2>
              <Link to="/complaint/list">
                <Button variant="outline">View Full List</Button>
              </Link>
            </div>
            
            <div className="bg-card rounded-md shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-32">Created</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.length > 0 ? (
                    complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-medium">{complaint.id}</TableCell>
                        <TableCell>{complaint.name}</TableCell>
                        <TableCell>{complaint.issueCategory}</TableCell>
                        <TableCell>{complaint.created}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            complaint.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                            complaint.status === "Resolved" ? "bg-green-100 text-green-800" :
                            complaint.status === "Rejected" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {complaint.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenComplaint(complaint)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No complaints found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      case "dashboard":
      default:
        return (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <div className="flex space-x-2">
                <Button onClick={() => handleOpenMessageDialog("john")}>
                  Message Student
                </Button>
                <Button onClick={() => handleOpenMessageDialog("amanda")}>
                  Message Helper
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">Total Students</h2>
                <p className="text-3xl font-bold">124</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">Active Helpers</h2>
                <p className="text-3xl font-bold">32</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">Pending Rides</h2>
                <p className="text-3xl font-bold">18</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">Completed Rides</h2>
                <p className="text-3xl font-bold">246</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">Open Complaints</h2>
                <p className="text-3xl font-bold">
                  {complaints.filter(c => c.status === "Pending").length || 7}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium mb-2">User Satisfaction</h2>
                <p className="text-3xl font-bold">94%</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar title="Admin Control Center" />

      <div className="flex flex-grow">
        {/* Sidebar */}
        <div className="w-64 bg-gray-200 dark:bg-gray-800 min-h-[calc(100vh-6rem)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
              <h2 className="font-medium text-lg dark:text-white">Control center</h2>
            </div>
            
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-md transition-colors
                    ${activeSection === item.id 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30"}`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">
            {activeSection === "dashboard" ? "Admin Dashboard" : 
             activeSection === "helpers" ? "Manage Helpers" :
             activeSection === "students" ? "Manage Students" :
             activeSection === "complaints" ? "View Complaints" :
             activeSection === "rides" ? "Ride Requests" : "Reports"}
          </h1>
          
          {renderContent()}
        </div>
      </div>

      {/* Complaint Review Dialog */}
      {selectedComplaint && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Review Complaint</DialogTitle>
              <DialogDescription>
                ID: {selectedComplaint.id} • {selectedComplaint.created}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium mb-1">Submitted By</p>
                <p className="text-sm">{selectedComplaint.name} ({selectedComplaint.email})</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Category</p>
                <p className="text-sm">{selectedComplaint.issueCategory}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  placeholder="Provide feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Follow-up Information</label>
                <Textarea
                  placeholder="Add follow-up details..."
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveComplaint}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to {messageRecipient === "john" ? "Student" : "Helper"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendMessage}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
