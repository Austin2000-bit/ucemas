
import React, { useState, useEffect } from "react";
import { useAuth } from "@/utils/auth";
import { SystemLogs } from "@/utils/systemLogs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Car, Laptop, UserCog, BarChart, History, Clock } from "lucide-react";
import AdminGadgetLending from "@/components/Admin/AdminGadgetLending";
import AdminUsers from "@/components/Admin/AdminUsers";
import AdminRideRequests from "@/components/Admin/AdminRideRequests";
import AssistantStatusHistory from "@/components/Admin/AssistantStatusHistory";
import Navbar from "@/components/Navbar";
import HelperStudentAssignment from "@/components/Admin/HelperStudentAssignment";
import { supabase } from "@/lib/supabase";
import { Complaint } from "@/types";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  url: string;
  id: string;
  title: string;
}

interface DashboardData {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  totalUsers: number;
  students: number;
  helpers: number;
  pendingRides: number;
  completedRides: number;
  totalRides: number;
  helpConfirmations: number;
  verifiedHelpConfirmations: number;
  recentActivity: Array<{
    timestamp: string;
    action: string;
    user: string;
    type: string;
  }>;
}

const Admin: React.FC = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [status, setStatus] = useState<"pending" | "in_progress" | "resolved">("pending");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [complaintUsers, setComplaintUsers] = useState<Record<string, User>>({});
  const [showLogsSidebar, setShowLogsSidebar] = useState(false);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  
  // Navigation items for the sidebar
  const sidebarItems: SidebarItem[] = [
    { icon: BarChart, label: "Dashboard", url: "dashboard", id: "dashboard", title: "Dashboard" },
    { icon: AlertTriangle, label: "Complaints", url: "complaints", id: "complaints", title: "Complaints" },
    { icon: Car, label: "Ride Requests", url: "ride-requests", id: "ride-requests", title: "Ride Requests" },
    { icon: Laptop, label: "Gadget Lending", url: "gadgets", id: "gadgets", title: "Gadget Lending" },
    { icon: UserCog, label: "User Management", url: "user-management", id: "user-management", title: "User Management" },
    { icon: History, label: "Assistant Status", url: "assistant-status", id: "assistant-status", title: "Assistant Status History" },
    { icon: Clock, label: "Assignments", url: "assignments", id: "assignments", title: "Student Assignments" },
  ];
  
  // Load complaints from database
  useEffect(() => {
    const fetchComplaints = async () => {
      if (activeSection === "complaints") {
        try {
          const { data, error } = await supabase
            .from('complaints')
            .select('*');

          if (error) {
            console.error("Error fetching complaints:", error);
            return;
          }

          setComplaints(data || []);
          console.log("Fetched complaints:", data);
          
          // Fetch users for the complaints
          if (data && data.length > 0) {
            const userIds = [...new Set(data.map(c => c.user_id))];
            console.log("Fetching users for IDs:", userIds);
            
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .in('id', userIds);
              
            if (userError) {
              console.error("Error fetching users:", userError);
              return;
            }
            
            console.log("Fetched users:", userData);
            
            // Create a map of user_id to user
            const userMap: Record<string, User> = {};
            userData?.forEach(user => {
              userMap[user.id] = user;
            });
            
            setComplaintUsers(userMap);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    };
    
    fetchComplaints();
  }, [activeSection]);

  // Fetch system logs
  useEffect(() => {
    const logs = SystemLogs.getSystemLogs();
    setSystemLogs(logs);
  }, [showLogsSidebar]);

  // Fetch dashboard data
  useEffect(() => {
    const rawData = SystemLogs.getDashboardSummary();
    // Transform the data to match our interface
    const transformedData: DashboardData = {
      totalComplaints: rawData.totalComplaints,
      pendingComplaints: rawData.pendingComplaints,
      resolvedComplaints: rawData.resolvedComplaints,
      totalUsers: rawData.totalUsers,
      students: rawData.students,
      helpers: rawData.helpers,
      pendingRides: rawData.pendingRides,
      completedRides: rawData.completedRides,
      totalRides: rawData.totalRides,
      helpConfirmations: rawData.helpConfirmations,
      verifiedHelpConfirmations: rawData.verifiedHelpConfirmations,
      recentActivity: rawData.recentActivity.map(activity => ({
        timestamp: activity.timestamp,
        action: activity.action,
        user: activity.userId,
        type: activity.userRole
      }))
    };
    setDashboardData(transformedData);
  }, []);

  // Load users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
        
      if (error) {
        console.error("Error fetching users:", error);
        return;
      }
      
      setUsers(data || []);
    };
    
    fetchUsers();
  }, []);

  // Handle opening complaint dialog
  const handleOpenComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setFeedback(complaint.feedback || "");
    setFollowUp(complaint.followUp || "");
    setStatus(complaint.status);
    setIsDialogOpen(true);
  };

  // Handle saving complaint updates
  const handleSaveComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          status,
          feedback,
          followUp
        })
        .eq('id', selectedComplaint.id);

      if (error) {
        console.error("Error updating complaint:", error);
        throw new Error("Failed to update complaint");
      }

      setComplaints(complaints.map(complaint => 
        complaint.id === selectedComplaint.id 
          ? { 
              ...complaint, 
              status, 
              feedback, 
              followUp 
            } 
          : complaint
      ));
      
      setIsDialogOpen(false);
      
      toast({
        title: "Complaint updated",
        description: `Complaint has been updated.`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to update complaint. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleLogsSidebar = () => {
    setShowLogsSidebar(!showLogsSidebar);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "users":
        return <AdminUsers />;
      case "complaints":
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complaints Management</CardTitle>
                <CardDescription>
                  View and manage user complaints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => {
                      const user = complaintUsers[complaint.user_id];
                      return (
                        <TableRow key={complaint.id}>
                          <TableCell>{complaint.id}</TableCell>
                          <TableCell>
                            {user ? `${user.first_name} ${user.last_name}` : complaint.user_id}
                            <div className="text-xs text-muted-foreground">
                              {user?.email || ''}
                            </div>
                          </TableCell>
                          <TableCell>{complaint.title}</TableCell>
                          <TableCell>{complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              complaint.status === "pending" ? "secondary" :
                              complaint.status === "resolved" ? "default" :
                              complaint.status === "in_progress" ? "outline" : "outline"
                            }>
                              {complaint.status}
                            </Badge>
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
                      );
                    })}
                    {complaints.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No complaints found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      case "ride-requests":
        return <AdminRideRequests />;
      case "gadgets":
        return <AdminGadgetLending />;
      case "user-management":
        return <AdminUsers />;
      case "assistant-status":
        return <AssistantStatusHistory />;
      case "assignments":
        return <HelperStudentAssignment />;
      case "dashboard":
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Students</CardTitle>
                  <CardDescription>Active students in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{dashboardData?.students}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Assistants</CardTitle>
                  <CardDescription>Currently active helpers</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{dashboardData?.helpers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pending Rides</CardTitle>
                  <CardDescription>Rides waiting for assistance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{dashboardData?.pendingRides}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Gadget Loans</CardTitle>
                  <CardDescription>Active gadget loans</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {(JSON.parse(localStorage.getItem("gadgetLoans") || "[]") as any[])
                      .filter(loan => loan.status === "borrowed").length}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData?.recentActivity.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                          <TableCell>{activity.action}</TableCell>
                          <TableCell>{activity.user}</TableCell>
                          <TableCell>{activity.type}</TableCell>
                        </TableRow>
                      ))}
                      {(!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No recent activity</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Reports Overview</CardTitle>
                  <CardDescription>System statistics and metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Complaint Resolution</h3>
                      <div className="mt-2 flex items-center">
                        <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div 
                            className="h-3 rounded-full bg-green-500" 
                            style={{ 
                              width: dashboardData?.totalComplaints ? 
                                `${(dashboardData.resolvedComplaints / dashboardData.totalComplaints) * 100}%` : '0%' 
                            }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm">
                          {dashboardData?.resolvedComplaints || 0}/{dashboardData?.totalComplaints || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Ride Completion</h3>
                      <div className="mt-2 flex items-center">
                        <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div 
                            className="h-3 rounded-full bg-blue-500" 
                            style={{ 
                              width: dashboardData?.totalRides ? 
                                `${(dashboardData.completedRides / dashboardData.totalRides) * 100}%` : '0%' 
                            }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm">
                          {dashboardData?.completedRides || 0}/{dashboardData?.totalRides || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      View Full Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <Navbar title="UDSNMS Admin Control Center" />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar title="UDSNMS Admin Control Center" />
      <div className="flex flex-grow relative">
        {/* Main Sidebar */}
        <div className="w-64 bg-gray-200 dark:bg-gray-800 min-h-[calc(100vh-6rem)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
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
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-4 mt-4 border-t border-gray-300 dark:border-gray-700">
            <button
              onClick={toggleLogsSidebar}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
            >
              <History className="h-4 w-4" />
              <span>System Logs</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">
            {activeSection === "dashboard" ? "UDSNMS Dashboard" : 
             activeSection === "helpers" ? "Manage Helpers" :
             activeSection === "students" ? "Manage Students" :
             activeSection === "complaints" ? "View Complaints" :
             activeSection === "ride-requests" ? "Ride Requests" :
             activeSection === "gadgets" ? "Gadget Lending" :
             activeSection === "users" ? "Users" :
             activeSection === "user-management" ? "User Management" : 
             activeSection === "assignments" ? "Student Assignments" :
             activeSection === "assistant-status" ? "Assistant Status History" : "Reports"}
          </h1>
          
          {renderContent()}
        </div>
        
        {/* System Logs Sidebar */}
        {showLogsSidebar && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 shadow-lg overflow-y-auto">
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-lg">System Logs</h2>
              <Button variant="ghost" size="sm" onClick={toggleLogsSidebar}>
                ✕
              </Button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {systemLogs.slice().reverse().map((log, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                      <Badge variant="outline">{log.userRole}</Badge>
                    </div>
                    <p className="font-medium mt-1">{log.action}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.details}</p>
                  </div>
                ))}
                {systemLogs.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No system logs found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Complaint Review Dialog */}
      {selectedComplaint && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Review Complaint</DialogTitle>
              <DialogDescription>
                ID: {selectedComplaint.id} • {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleDateString() : '-'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium mb-1">Submitted By</p>
                <p className="text-sm">
                  {complaintUsers[selectedComplaint.user_id] ? 
                    `${complaintUsers[selectedComplaint.user_id].first_name} ${complaintUsers[selectedComplaint.user_id].last_name}` : 
                    selectedComplaint.user_id}
                    {complaintUsers[selectedComplaint.user_id]?.email && 
                      ` (${complaintUsers[selectedComplaint.user_id].email})`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Category</p>
                <p className="text-sm">{selectedComplaint.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(value: "pending" | "in_progress" | "resolved") => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
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
    </div>
  );
};

export default Admin;
