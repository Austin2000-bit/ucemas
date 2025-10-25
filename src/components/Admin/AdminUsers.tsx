import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { SystemLogs } from "@/utils/systemLogs";
import MessageSystem from "@/components/Messaging/MessageSystem";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Download, Search, UserPlus, MessageSquare, Trash2, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HelperStudentAssignment from "./HelperStudentAssignment";
import { User } from "@/types";

interface Assignment {
  id: string;
  client_id: string;
  assistant_id: string;
  status: string;
  created_at: string;
  student?: User;
  helper?: User;
}

// Map disability types to services
const disabilityServices: Record<string, string[]> = {
  "Total Blind": ["reading", "mobility services", "Transcription"],
  "Low Vision": ["Reading", "mobility for complicated infrastructure and Large prints"],
  "Total Deaf": ["Note taking service", "Interpretation"],
  "Hard of hearing": ["Note taking service"],
  "Deafblind": ["Mobility", "note taking"],
  "Physical Disability": ["Mobility"],
  "Chronic health Disease": ["Mobility", "health care"]
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<User | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: usersData, error: usersError } = await supabase.from("users").select("*");
        if (usersError) throw usersError;

        // Debug: Log user data to see what fields are available
        console.log("Loaded users data:", usersData);
        if (usersData && usersData.length > 0) {
          console.log("Sample user data:", usersData[0]);
          console.log("Application letter URL:", usersData[0].application_letter_url);
        }

        const { data: assignmentsData, error: assignmentsError } = await supabase.from("assistant_client_assignments").select("*");
        if (assignmentsError) throw assignmentsError;

        const populatedAssignments = (assignmentsData || []).map((assignment) => {
          const client = usersData?.find((u) => u.id === assignment.client_id);
          const assistant = usersData?.find((u) => u.id === assignment.assistant_id);
          return { ...assignment, student: client, helper: assistant };
        });

        setUsers(usersData || []);
        setAssignments(populatedAssignments);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "assistants") return user.role === "assistant" && matchesSearch;
    if (activeTab === "clients") return user.role === "client" && matchesSearch;
    if (activeTab === "drivers") return user.role === "driver" && matchesSearch;
    return matchesSearch;
  });

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleMessage = (user: User) => {
    setSelectedUserForMessage(user);
    setIsMessageDialogOpen(true);
  };

  const downloadUserPDF = (user: User) => {
    const content = `
      <html>
        <head>
          <title>User Information - ${user.first_name} ${user.last_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; }
            .value { margin-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UCEMAS - User Information</h1>
            <h2>${user.first_name} ${user.last_name}</h2>
          </div>
          
          <div class="section">
            <h3>Personal Information</h3>
            <p><span class="label">Name:</span> <span class="value">${user.first_name} ${user.last_name}</span></p>
            <p><span class="label">Email:</span> <span class="value">${user.email}</span></p>
            <p><span class="label">Phone:</span> <span class="value">${user.phone || 'Not provided'}</span></p>
            <p><span class="label">Role:</span> <span class="value">${user.role}</span></p>
            <p><span class="label">Status:</span> <span class="value">${user.status || 'Active'}</span></p>
            <p><span class="label">Created:</span> <span class="value">${new Date(user.created_at || '').toLocaleDateString()}</span></p>
          </div>

          ${user.role === 'client' ? `
          <div class="section">
            <h3>Client Information</h3>
            <p><span class="label">Disability Type:</span> <span class="value">${user.disability_type || 'Not specified'}</span></p>
            <p><span class="label">Services Needed:</span> <span class="value">${user.services_needed?.join(', ') || 'Not specified'}</span></p>
          </div>
          ` : ''}

          ${user.role === 'assistant' ? `
          <div class="section">
            <h3>Assistant Information</h3>
            <p><span class="label">Assistant Type:</span> <span class="value">${user.assistant_type || 'Not specified'}</span></p>
            <p><span class="label">Specialization:</span> <span class="value">${user.assistant_specialization || 'Not specified'}</span></p>
            <p><span class="label">Level:</span> <span class="value">${user.assistant_level || 'Not specified'}</span></p>
            <p><span class="label">Time Period:</span> <span class="value">${user.time_period || 'Not specified'}</span></p>
            <p><span class="label">Bank:</span> <span class="value">${user.bank_account || 'Not specified'}</span></p>
            <p><span class="label">Account Number:</span> <span class="value">${user.bank_account_number || 'Not specified'}</span></p>
          </div>
          ` : ''}

          <div class="section">
            <h3>Documents</h3>
            <p><span class="label">Profile Picture:</span> <span class="value">${user.profile_picture_url ? 'Available' : 'Not uploaded'}</span></p>
            ${user.role === 'assistant' ? `<p><span class="label">Application Letter:</span> <span class="value">${user.application_letter_url ? 'Available' : 'Not uploaded'}</span></p>` : ''}
            ${user.role === 'client' ? `<p><span class="label">Disability Video:</span> <span class="value">${user.disability_video_url ? 'Available' : 'Not uploaded'}</span></p>` : ''}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${user.first_name}_${user.last_name}_info.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllUsersPDF = (users: User[]) => {
    const content = `
      <html>
        <head>
          <title>All Users Report - UCEMAS</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .role-admin { background-color: #ffebee; }
            .role-helper { background-color: #e8f5e8; }
            .role-student { background-color: #e3f2fd; }
            .role-driver { background-color: #fff3e0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>UCEMAS - All Users Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Users: ${users.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Additional Info</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => `
                <tr class="role-${user.role}">
                  <td>${user.first_name} ${user.last_name}</td>
                  <td>${user.email}</td>
                  <td>${user.role}</td>
                  <td>${user.phone || '-'}</td>
                  <td>${user.status || 'Active'}</td>
                  <td>${new Date(user.created_at || '').toLocaleDateString()}</td>
                  <td>
                    ${user.role === 'client' ? `Disability: ${user.disability_type || '-'}` : ''}
                    ${user.role === 'assistant' ? `Type: ${user.assistant_type || '-'}, Spec: ${user.assistant_specialization || '-'}` : ''}
                    ${user.role === 'driver' ? 'Driver' : ''}
                    ${user.role === 'admin' ? 'Administrator' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_users_report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase.from("users").delete().eq("id", selectedUser.id);
      if (error) throw error;
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setIsDeleteDialogOpen(false);
      SystemLogs.addLog("User Deletion", `User ${selectedUser.first_name} ${selectedUser.last_name} deleted`, "admin", "admin");
      toast({ title: "User Deleted", description: `User ${selectedUser.first_name} deleted` });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    }
  };

  const renderUserTable = (data: User[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Profile</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Services Needed</TableHead>
          <TableHead>Documents</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              {user.profile_picture_url ? (
                <img 
                  src={user.profile_picture_url} 
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </span>
                </div>
              )}
            </TableCell>
            <TableCell>{user.first_name} {user.last_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{user.phone}</TableCell>
            <TableCell>
              {user.role === "client"
                ? user.services_needed?.length
                    ? user.services_needed.join(", ")
                    : (user.disability_type && disabilityServices[user.disability_type]?.join(", ")) || "-"
                : "-"}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {user.role === "assistant" && (
                  <>
                    {user.application_letter_url ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(user.application_letter_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Application
                      </Button>
                    ) : (
                      <span className="text-sm text-gray-500">No application letter</span>
                    )}
                  </>
                )}
                {user.role === "client" && user.disability_video_url && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(user.disability_video_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                )}
              </div>
            </TableCell>
            <TableCell className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleView(user)}>
                <Eye />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => downloadUserPDF(user)} title="Download User Info">
                <FileText />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleMessage(user)}>
                <MessageSquare />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) return <div className="text-center py-4">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => downloadAllUsersPDF(filteredUsers)}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Download All Users Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderUserTable(filteredUsers)}</TabsContent>
        <TabsContent value="assistants">{renderUserTable(filteredUsers.filter(u => u.role === "assistant"))}</TabsContent>
        <TabsContent value="clients">{renderUserTable(filteredUsers.filter(u => u.role === "client"))}</TabsContent>
        <TabsContent value="drivers">{renderUserTable(filteredUsers.filter(u => u.role === "driver"))}</TabsContent>
        <TabsContent value="assignments"><HelperStudentAssignment /></TabsContent>
      </Tabs>

      {/* View, Delete, Message dialogs */}
      {isViewDialogOpen && selectedUser && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>View User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedUser.profile_picture_url ? (
                  <img 
                    src={selectedUser.profile_picture_url} 
                    alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                      {selectedUser.first_name.charAt(0)}{selectedUser.last_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.first_name} {selectedUser.last_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p><b>Role:</b> {selectedUser.role}</p>
                <p><b>Phone:</b> {selectedUser.phone || "Not provided"}</p>
                {selectedUser.role === "client" && selectedUser.services_needed && (
                  <p><b>Services Needed:</b> {selectedUser.services_needed.join(", ")}</p>
                )}
                {selectedUser.role === "assistant" && selectedUser.application_letter_url && (
                  <div className="flex items-center gap-2">
                    <b>Application Letter:</b>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(selectedUser.application_letter_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
                {selectedUser.role === "client" && selectedUser.disability_video_url && (
                  <div className="flex items-center gap-2">
                    <b>Disability Video:</b>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(selectedUser.disability_video_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isDeleteDialogOpen && selectedUser && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete {selectedUser.first_name} {selectedUser.last_name}?</p>
            <DialogFooter>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
              <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isMessageDialogOpen && selectedUserForMessage && (
        <MessageSystem 
          recipient={selectedUserForMessage.email} 
          onClose={() => setIsMessageDialogOpen(false)} 
        />
      )}
    </div>
  );
};

export default AdminUsers;
