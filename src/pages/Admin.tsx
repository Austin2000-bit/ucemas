
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { v4 as uuidv4 } from "uuid";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/utils/auth";
import { supabase, User, UserRole } from "@/lib/supabase";
import AdminGadgetLending from "@/components/Admin/AdminGadgetLending";
import MessageSystem from "@/components/Messaging/MessageSystem";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "student" as UserRole,
  });
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [isResolvingComplaint, setIsResolvingComplaint] = useState(false);
  const [isReopeningComplaint, setIsReopeningComplaint] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  // Load users data
  useEffect(() => {
    // Get users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    setUsers(storedUsers);
    
    // Get complaints
    const storedComplaints = JSON.parse(localStorage.getItem("complaints") || "[]");
    setComplaints(storedComplaints);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setNewUser((prev) => ({ ...prev, role: value as UserRole }));
  };

  const handleEditRoleChange = (value: string) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, role: value as UserRole });
    }
  };

  const handleCreateUser = async () => {
    try {
      // Basic validation
      if (!newUser.first_name || !newUser.last_name || !newUser.email) {
        toast({
          title: "Missing Information",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }
      
      // Check if email already exists
      const emailExists = users.some(user => user.email === newUser.email);
      if (emailExists) {
        toast({
          title: "Email Already Exists",
          description: "A user with this email already exists.",
          variant: "destructive",
        });
        return;
      }

      // Create user in supabase (mocked for now)
      const userId = uuidv4();
      const createdUser: User = {
        id: userId,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
        photo: `/default-avatar.png`
      };

      // Update local storage
      const updatedUsers = [...users, createdUser];
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Update state
      setUsers(updatedUsers);
      setIsUserDialogOpen(false);
      
      // Reset form
      setNewUser({
        first_name: "",
        last_name: "",
        email: "",
        role: "student" as UserRole,
      });
      
      toast({
        title: "User Created",
        description: `${newUser.first_name} ${newUser.last_name} has been added as a ${newUser.role}.`,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleSaveUserEdit = () => {
    if (!editingUser) return;

    try {
      // Update user in local storage
      const updatedUsers = users.map(user => 
        user.id === editingUser.id ? editingUser : user
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Update state
      setUsers(updatedUsers);
      setIsEditUserDialogOpen(false);
      
      toast({
        title: "User Updated",
        description: `${editingUser.first_name} ${editingUser.last_name}'s information has been updated.`,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    try {
      // Remove user from local storage
      const updatedUsers = users.filter(user => user.id !== userId);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Update state
      setUsers(updatedUsers);
      
      toast({
        title: "User Deleted",
        description: "User has been removed from the system.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewComplaint = (complaint: any) => {
    setSelectedComplaint(complaint);
  };

  const handleResolveComplaint = async () => {
    if (!selectedComplaint) return;
    
    try {
      setIsResolvingComplaint(true);
      
      // Update complaint status
      const updatedComplaints = complaints.map(complaint => 
        complaint.id === selectedComplaint.id 
          ? { ...complaint, status: "resolved", resolvedAt: new Date().toISOString() }
          : complaint
      );
      
      // Save to localStorage
      localStorage.setItem("complaints", JSON.stringify(updatedComplaints));
      
      // Update state
      setComplaints(updatedComplaints);
      setSelectedComplaint({ ...selectedComplaint, status: "resolved", resolvedAt: new Date().toISOString() });
      
      toast({
        title: "Complaint Resolved",
        description: "The complaint has been marked as resolved.",
      });
    } catch (error) {
      console.error("Error resolving complaint:", error);
      toast({
        title: "Error",
        description: "Failed to resolve complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResolvingComplaint(false);
    }
  };
  
  const handleReopenComplaint = async () => {
    if (!selectedComplaint) return;
    
    try {
      setIsReopeningComplaint(true);
      
      // Update complaint status
      const updatedComplaints = complaints.map(complaint => 
        complaint.id === selectedComplaint.id 
          ? { ...complaint, status: "open", reopenedAt: new Date().toISOString() }
          : complaint
      );
      
      // Save to localStorage
      localStorage.setItem("complaints", JSON.stringify(updatedComplaints));
      
      // Update state
      setComplaints(updatedComplaints);
      setSelectedComplaint({ ...selectedComplaint, status: "open", reopenedAt: new Date().toISOString() });
      
      toast({
        title: "Complaint Reopened",
        description: "The complaint has been reopened for further investigation.",
      });
    } catch (error) {
      console.error("Error reopening complaint:", error);
      toast({
        title: "Error",
        description: "Failed to reopen complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReopeningComplaint(false);
    }
  };

  const handleDeleteAttachment = (attachmentUrl: string) => {
    setAttachmentToDelete(attachmentUrl);
    setIsDeletingAttachment(true);
  };

  const handleConfirmDeleteAttachment = async () => {
    if (!selectedComplaint || !attachmentToDelete) return;
    
    try {
      // Filter out the attachment to delete
      const updatedAttachments = selectedComplaint.attachments.filter(
        (attachment: string) => attachment !== attachmentToDelete
      );
      
      // Update the complaint with the new attachments list
      const updatedComplaints = complaints.map(complaint => 
        complaint.id === selectedComplaint.id 
          ? { ...complaint, attachments: updatedAttachments }
          : complaint
      );
      
      // Save to localStorage
      localStorage.setItem("complaints", JSON.stringify(updatedComplaints));
      
      // Update state
      setComplaints(updatedComplaints);
      setSelectedComplaint({ ...selectedComplaint, attachments: updatedAttachments });
      
      toast({
        title: "Attachment Deleted",
        description: "The attachment has been deleted successfully.",
      });
      
      // Close the confirmation dialog
      setIsDeletingAttachment(false);
      setAttachmentToDelete(null);
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast({
        title: "Error",
        description: "Failed to delete attachment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelDeleteAttachment = () => {
    setIsDeletingAttachment(false);
    setAttachmentToDelete(null);
  };

  const getAttachmentFilename = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const getAttachmentExtension = (url: string) => {
    const filename = getAttachmentFilename(url);
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const isImageAttachment = (url: string) => {
    const ext = getAttachmentExtension(url);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  };

  const isPdfAttachment = (url: string) => {
    return getAttachmentExtension(url) === 'pdf';
  };

  const usernameFromId = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  if (user?.role !== "admin") {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar title="Admin Dashboard" />
      
      <div className="container mx-auto p-4">
        <Tabs 
          defaultValue="users" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="confirmations">Confirmations</TabsTrigger>
              <TabsTrigger value="gadgets">Gadget Lending</TabsTrigger>
            </TabsList>
            
            {activeTab === "users" && (
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add User</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user for the system.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          placeholder="First Name"
                          value={newUser.first_name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          placeholder="Last Name"
                          value={newUser.last_name}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        value={newUser.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={handleRoleChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="helper">Helper</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser}>
                        Create User
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all users in the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={
                              user.role === "admin" ? "default" :
                              user.role === "helper" ? "secondary" :
                              user.role === "driver" ? "outline" : "default"
                            }>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Complaints Tab */}
          <TabsContent value="complaints">
            {selectedComplaint ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Complaint Details</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(selectedComplaint.timestamp).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedComplaint(null)}
                  >
                    Back to List
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {selectedComplaint.subject}
                    </h3>
                    <Badge variant={
                      selectedComplaint.status === "resolved" ? "outline" : 
                      selectedComplaint.status === "open" ? "secondary" : 
                      "default"
                    }>
                      {selectedComplaint.status}
                    </Badge>
                  </div>
                  
                  {/* Complaint Information */}
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">From:</span> {usernameFromId(selectedComplaint.userId)}</p>
                    <p><span className="font-medium">Submitted On:</span> {new Date(selectedComplaint.timestamp).toLocaleString()}</p>
                    {selectedComplaint.status === "resolved" && (
                      <p><span className="font-medium">Resolved On:</span> {new Date(selectedComplaint.resolvedAt).toLocaleString()}</p>
                    )}
                    {selectedComplaint.status === "open" && selectedComplaint.reopenedAt && (
                      <p><span className="font-medium">Reopened On:</span> {new Date(selectedComplaint.reopenedAt).toLocaleString()}</p>
                    )}
                  </div>
                  
                  {/* Complaint Description */}
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Description</h4>
                    <div className="border rounded p-4 bg-gray-50 dark:bg-gray-800">
                      <p className="whitespace-pre-line">{selectedComplaint.description}</p>
                    </div>
                  </div>
                  
                  {/* Attachments Section */}
                  {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="font-medium">Attachments ({selectedComplaint.attachments.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedComplaint.attachments.map((attachment: string, idx: number) => (
                          <div key={idx} className="border rounded-md p-3 flex flex-col">
                            <div className="mb-2">
                              {isImageAttachment(attachment) ? (
                                <div className="aspect-video w-full overflow-hidden rounded">
                                  <img 
                                    src={attachment} 
                                    alt={`Attachment ${idx}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : isPdfAttachment(attachment) ? (
                                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded">
                                  <span className="text-gray-500">PDF Document</span>
                                </div>
                              ) : (
                                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded">
                                  <span className="text-gray-500">File</span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-auto">
                              <a 
                                href={attachment} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[180px]"
                              >
                                {getAttachmentFilename(attachment)}
                              </a>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteAttachment(attachment)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
                    {selectedComplaint.status !== 'resolved' ? (
                      <Button onClick={handleResolveComplaint} disabled={isResolvingComplaint}>
                        {isResolvingComplaint ? "Resolving..." : "Resolve Complaint"}
                      </Button>
                    ) : (
                      <Button onClick={handleReopenComplaint} disabled={isReopeningComplaint}>
                        {isReopeningComplaint ? "Reopening..." : "Reopen Complaint"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Complaints Management</CardTitle>
                  <CardDescription>
                    View and manage user complaints.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {complaints.length > 0 ? (
                        complaints.map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell>{complaint.subject}</TableCell>
                            <TableCell>{usernameFromId(complaint.userId)}</TableCell>
                            <TableCell>{new Date(complaint.timestamp).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={
                                complaint.status === "resolved" ? "outline" : 
                                complaint.status === "open" ? "secondary" : 
                                "default"
                              }>
                                {complaint.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewComplaint(complaint)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No complaints found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Confirmations Tab */}
          <TabsContent value="confirmations">
            <Card>
              <CardHeader>
                <CardTitle>Student Confirmation Logs</CardTitle>
                <CardDescription>
                  View student help confirmation history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/confirmation-logs">
                  <Button>View Full Confirmation Logs</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gadget Lending Tab */}
          <TabsContent value="gadgets">
            <AdminGadgetLending />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={editingUser.first_name}
                    onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={editingUser.last_name}
                    onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={handleEditRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="helper">Helper</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveUserEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Attachment Confirmation Dialog */}
      {isDeletingAttachment && attachmentToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Delete Attachment</h2>
            <p>Are you sure you want to delete this attachment?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="secondary" onClick={handleCancelDeleteAttachment}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDeleteAttachment}>Delete Attachment</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
