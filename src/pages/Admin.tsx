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
import { 
  AlertTriangle, 
  Car, 
  Laptop, 
  UserCog,
  List,
  BarChart,
  MonitorDot,
  Users
} from "lucide-react";
import AdminGadgetLending from "@/components/Admin/AdminGadgetLending";
import AdminUsers from "@/components/Admin/AdminUsers";
import AdminRideRequests from "@/components/Admin/AdminRideRequests";
import Navbar from "@/components/Navbar";
import HelperStudentAssignment from "@/components/Admin/HelperStudentAssignment";
import HelperStatusTracking from "@/components/Admin/HelperStatusTracking";
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
  const [systemLogsOpen, setSystemLogsOpen] = useState(false);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  
  // Navigation items for the sidebar - with Reports added
  const sidebarItems: SidebarItem[] = [
    { icon: AlertTriangle, label: "Complaints", url: "complaints", id: "complaints", title: "Complaints" },
    { icon: Car, label: "Ride Requests", url: "ride-requests", id: "ride-requests", title: "Ride Requests" },
    { icon: Laptop, label: "Gadget Lending", url: "gadgets", id: "gadgets", title: "Gadget Lending" },
    { icon: UserCog, label: "User Management", url: "user-management", id: "user-management", title: "User Management" },
    { icon: List, label: "Helper Status", url: "helper-status", id: "helper-status", title: "Helper Status Tracking" },
    { icon: MonitorDot, label: "System Logs", url: "system-logs", id: "system-logs", title: "System Logs" }
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
  }, []);

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
          follow_up: followUp,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedComplaint.id);

      if (error) {
        console.error("Error updating complaint:", error);
        throw new Error(error.message || "Failed to update complaint");
      }

      // Update local state
      setComplaints(complaints.map(complaint => 
        complaint.id === selectedComplaint.id 
          ? { 
              ...complaint, 
              status, 
              feedback, 
              follow_up: followUp,
              updated_at: new Date().toISOString()
            } 
          : complaint
      ));
      
      setIsDialogOpen(false);
      
      toast({
        title: "Complaint updated",
        description: "Complaint has been updated successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update complaint. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserFullName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    if (user) {
      return `${user.first_name} ${user.last_name}`;
    }
    return userId; // Fallback to ID if user not found
  };

  const formatComplaintId = (id: string, index: number): string => {
    // Format the sequential number with leading zeros
    const sequentialNumber = (index + 1).toString().padStart(3, '0');
    return `COMP-${sequentialNumber}`;
  };

  const renderContent = () => {
    switch (activeSection) {
      case "complaints":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Complaints</CardTitle>
                <CardDescription>View and manage student complaints</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 font-poppins">ID</TableHead>
                      <TableHead className="font-poppins">Name</TableHead>
                      <TableHead className="font-poppins">Category</TableHead>
                      <TableHead className="w-32 font-poppins">Created</TableHead>
                      <TableHead className="w-24 font-poppins">Status</TableHead>
                      <TableHead className="w-24 text-right font-poppins">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint, index) => (
                        <TableRow key={complaint.id}>
                        <TableCell className="font-medium font-poppins">{formatComplaintId(complaint.id!, index)}</TableCell>
                        <TableCell className="font-poppins">{complaintUsers[complaint.user_id]?.first_name} {complaintUsers[complaint.user_id]?.last_name}</TableCell>
                        <TableCell className="font-poppins">{complaint.title}</TableCell>
                        <TableCell className="font-poppins">{complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell className="font-poppins">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            complaint.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            complaint.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                            complaint.status === "resolved" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('_', ' ')}
                          </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setIsDialogOpen(true);
                            }}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                    ))}
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
      case "helper-status":
        return <HelperStatusTracking />;
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.students || 0} students, {dashboardData?.helpers || 0} helpers
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Complaints</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalComplaints || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.pendingComplaints || 0} pending, {dashboardData?.resolvedComplaints || 0} resolved
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ride Requests</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.totalRides || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.pendingRides || 0} pending, {dashboardData?.completedRides || 0} completed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Help Confirmations</CardTitle>
                  <Laptop className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData?.helpConfirmations || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData?.verifiedHelpConfirmations || 0} verified
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {dashboardData?.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {activity.type === "complaint" && <AlertTriangle className="h-4 w-4" />}
                          {activity.type === "ride" && <Car className="h-4 w-4" />}
                          {activity.type === "help" && <Laptop className="h-4 w-4" />}
                          {activity.type === "user" && <Users className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.user}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <Navbar title="Admin Control Center" />
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
        {/* Sidebar */}
        <div className="w-64 bg-gray-200 dark:bg-gray-800 min-h-[calc(100vh-6rem)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
              <h2 className="font-medium text-lg dark:text-white">Control center</h2>
            </div>
            
            <nav className="space-y-1">
              <button 
                key="dashboard" 
                onClick={() => setActiveSection("dashboard")}
                className={`flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-md transition-colors
                  ${activeSection === "dashboard" 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/30"}`
                }
              >
                <UserCog className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold dark:text-white">
              {activeSection === "dashboard" ? "Admin Dashboard" : 
               activeSection === "helpers" ? "Manage Helpers" :
               activeSection === "students" ? "Manage Students" :
               activeSection === "complaints" ? "View Complaints" :
               activeSection === "ride-requests" ? "Ride Requests" :
               activeSection === "gadgets" ? "Gadget Lending" :
               activeSection === "users" ? "Users" :
               activeSection === "user-management" ? "User Management" :
               activeSection === "helper-status" ? "Helper Status Tracking" : 
               "Reports"}
            </h1>
          </div>
          
          {renderContent()}
        </div>
      </div>

      {/* Complaint Review Dialog */}
      {selectedComplaint && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Complaint</DialogTitle>
              <DialogDescription>
                ID: {formatComplaintId(selectedComplaint.id!, complaints.findIndex(c => c.id === selectedComplaint.id))} • {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleDateString() : '-'}
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
                <Select value={status} onValueChange={(value: "pending" | "in_progress" | "resolved" | undefined) => setStatus(value as "pending" | "in_progress" | "resolved")}>
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
            <DialogFooter className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4">
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
