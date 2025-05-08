import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/utils/auth";
import { supabase, User, UserRole } from "@/lib/supabase";
import AdminGadgetLending from "@/components/Admin/AdminGadgetLending";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student" as UserRole,
  });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserData, setEditingUserData] = useState<Omit<User, 'email' | 'created_at' | 'updated_at'>>({
    id: "",
    first_name: "",
    last_name: "",
    role: "student",
  });
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [complaintFeedback, setComplaintFeedback] = useState("");
  const [complaintFollowUp, setComplaintFollowUp] = useState("");
  const [isResolvingComplaint, setIsResolvingComplaint] = useState(false);
  const [isReopeningComplaint, setIsReopeningComplaint] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isViewingAttachments, setIsViewingAttachments] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Load users and complaints on mount
    const loadData = async () => {
      if (!user) return;

      try {
        // Get all users from database
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');

        if (usersError) throw usersError;

        setUsers(usersData || []);

        // Get all complaints from database
        const { data: complaintsData, error: complaintsError } = await supabase
          .from('complaints')
          .select('*');

        if (complaintsError) throw complaintsError;

        setComplaints(complaintsData || []);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value as UserRole }));
  };

  const handleAddUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.first_name || !newUserData.last_name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { success, error } = await supabase.signUp(
        newUserData.email,
        newUserData.password,
        {
          first_name: newUserData.first_name,
          last_name: newUserData.last_name,
          role: newUserData.role,
        }
      );

      if (!success) {
        toast({
          title: "Error",
          description: `Failed to add user: ${error?.message}`,
          variant: "destructive",
        });
        return;
      }

      // Refresh users list
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      setUsers(usersData || []);

      toast({
        title: "Success",
        description: "User added successfully",
      });

      setIsAddingUser(false);
      setNewUserData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "student",
      });
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: `Failed to add user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (userId: string) => {
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
      setEditingUserId(userId);
      setEditingUserData({
        id: userToEdit.id,
        first_name: userToEdit.first_name,
        last_name: userToEdit.last_name,
        role: userToEdit.role,
      });
      setIsEditingUser(true);
    }
  };

  const handleEditingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditingSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingUserData(prev => ({ ...prev, [name]: value as UserRole }));
  };

  const handleUpdateUser = async () => {
    if (!editingUserId || !editingUserData.first_name || !editingUserData.last_name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editingUserData.first_name,
          last_name: editingUserData.last_name,
          role: editingUserData.role,
        })
        .eq('id', editingUserId);

      if (error) throw error;

      // Refresh users list
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      setUsers(usersData || []);

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditingUser(false);
      setEditingUserId(null);
      setEditingUserData({
        id: "",
        first_name: "",
        last_name: "",
        role: "student",
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    setDeletingUserId(userId);
    setIsDeletingUser(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUserId) {
      toast({
        title: "Error",
        description: "No user selected for deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(deletingUserId);

      if (error) throw error;

      // Refresh users list
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      setUsers(usersData || []);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setIsDeletingUser(false);
      setDeletingUserId(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleCancelDeleteUser = () => {
    setIsDeletingUser(false);
    setDeletingUserId(null);
  };

  const handleSendMessage = (recipientId: string) => {
    setMessageRecipient(recipientId);
    setIsSendingMessage(true);
  };

  const handleSendingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "subject") {
      setMessageSubject(value);
    } else if (name === "content") {
      setMessageContent(value);
    }
  };

  const handleSendAdminMessage = async () => {
    if (!messageRecipient || !messageSubject || !messageContent) {
      toast({
        title: "Error",
        description: "Please fill in all message fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_messages')
        .insert({
          recipient: messageRecipient,
          subject: messageSubject,
          content: messageContent,
          timestamp: Date.now(),
          read: false,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      setIsSendingMessage(false);
      setMessageRecipient("");
      setMessageSubject("");
      setMessageContent("");
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleViewComplaint = (complaintId: string) => {
    const complaint = complaints.find(c => c.id === complaintId);
    setSelectedComplaint(complaint);
    setComplaintFeedback(complaint?.feedback || "");
    setComplaintFollowUp(complaint?.followUp || "");
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComplaintFeedback(e.target.value);
  };

  const handleFollowUpChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComplaintFollowUp(e.target.value);
  };

  const handleResolveComplaint = async () => {
    if (!selectedComplaint) {
      toast({
        title: "Error",
        description: "No complaint selected",
        variant: "destructive",
      });
      return;
    }

    setIsResolvingComplaint(true);

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'resolved',
          feedback: complaintFeedback,
          followUp: complaintFollowUp,
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      // Refresh complaints list
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('*');

      if (complaintsError) throw complaintsError;

      setComplaints(complaintsData || []);

      toast({
        title: "Success",
        description: "Complaint resolved successfully",
      });

      setIsResolvingComplaint(false);
      setSelectedComplaint(null);
      setComplaintFeedback("");
      setComplaintFollowUp("");
    } catch (error: any) {
      console.error('Error resolving complaint:', error);
      toast({
        title: "Error",
        description: `Failed to resolve complaint: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleReopenComplaint = async () => {
    if (!selectedComplaint) {
      toast({
        title: "Error",
        description: "No complaint selected",
        variant: "destructive",
      });
      return;
    }

    setIsReopeningComplaint(true);

    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: 'in_progress',
          feedback: complaintFeedback,
          followUp: complaintFollowUp,
        })
        .eq('id', selectedComplaint.id);

      if (error) throw error;

      // Refresh complaints list
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('*');

      if (complaintsError) throw complaintsError;

      setComplaints(complaintsData || []);

      toast({
        title: "Success",
        description: "Complaint reopened successfully",
      });

      setIsReopeningComplaint(false);
      setSelectedComplaint(null);
      setComplaintFeedback("");
      setComplaintFollowUp("");
    } catch (error: any) {
      console.error('Error reopening complaint:', error);
      toast({
        title: "Error",
        description: `Failed to reopen complaint: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(files);

    // Generate previews
    const previews = files.map(file => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  const handleUploadAttachments = async () => {
    if (!selectedComplaint) {
      toast({
        title: "Error",
        description: "No complaint selected",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "Error",
        description: "No files selected for upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `complaints/${selectedComplaint.id}/${Date.now()}-${i}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const url = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath).data.publicUrl;

        uploadedUrls.push(url);

        // Update progress
        const progress = Math.round(((i + 1) / uploadedFiles.length) * 100);
        setUploadProgress(progress);
      }

      // Update complaint with attachment URLs
      const existingAttachments = selectedComplaint.attachments || [];
      const updatedAttachments = [...existingAttachments, ...uploadedUrls];

      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          attachments: updatedAttachments,
        })
        .eq('id', selectedComplaint.id);

      if (updateError) throw updateError;

      // Refresh complaints list
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('*');

      if (complaintsError) throw complaintsError;

      setComplaints(complaintsData || []);

      toast({
        title: "Success",
        description: "Attachments uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading attachments:', error);
      toast({
        title: "Error",
        description: `Failed to upload attachments: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadedFiles([]);
      setFilePreviews([]);
    }
  };

  const handleViewAttachments = (complaintId: string) => {
    const complaint = complaints.find(c => c.id === complaintId);
    if (complaint && complaint.attachments && complaint.attachments.length > 0) {
      setSelectedAttachments(complaint.attachments);
      setIsViewingAttachments(true);
    } else {
      toast({
        title: "No Attachments",
        description: "No attachments found for this complaint",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAttachment = (attachmentUrl: string) => {
    setAttachmentToDelete(attachmentUrl);
    setIsDeletingAttachment(true);
  };

  const handleConfirmDeleteAttachment = async () => {
    if (!selectedComplaint || !attachmentToDelete) {
      toast({
        title: "Error",
        description: "No attachment selected for deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      // Extract file path from URL
      const filePath = attachmentToDelete.replace(`${supabase.storageUrl}/object/public/attachments/`, '');

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('attachments')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update complaint with remaining attachments
      const updatedAttachments = selectedComplaint.attachments.filter(url => url !== attachmentToDelete);

      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          attachments: updatedAttachments,
        })
        .eq('id', selectedComplaint.id);

      if (updateError) throw updateError;

      // Refresh complaints list
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('*');

      if (complaintsError) throw complaintsError;

      setComplaints(complaintsData || []);

      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Error",
        description: `Failed to delete attachment: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeletingAttachment(false);
      setAttachmentToDelete(null);
      setIsViewingAttachments(false);
    }
  };

  const handleCancelDeleteAttachment = () => {
    setIsDeletingAttachment(false);
    setAttachmentToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Add, edit, and delete users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.first_name} {user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" onClick={() => handleEditUser(user.id)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
                          <Button size="sm" onClick={() => handleSendMessage(user.id)}>Message</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button className="mt-4" onClick={() => setIsAddingUser(true)}>Add User</Button>
            </CardContent>
          </Card>

          {/* Complaint Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Management</CardTitle>
              <CardDescription>View, resolve, and manage user complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell>{complaint.title}</TableCell>
                        <TableCell>{complaint.status}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" onClick={() => handleViewComplaint(complaint.id)}>View</Button>
                          <Button size="sm" variant="secondary" onClick={() => handleViewAttachments(complaint.id)}>Attachments</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gadget Lending Management Section */}
        <div className="mt-8">
          <AdminGadgetLending />
        </div>

        {/* Add User Modal */}
        {isAddingUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
              <h2 className="text-xl font-semibold mb-4">Add New User</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input type="email" id="email" name="email" value={newUserData.email} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input type="password" id="password" name="password" value={newUserData.password} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input type="text" id="first_name" name="first_name" value={newUserData.first_name} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input type="text" id="last_name" name="last_name" value={newUserData.last_name} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select id="role" name="role" value={newUserData.role} onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value as UserRole }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="helper">Helper</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="secondary" onClick={() => setIsAddingUser(false)}>Cancel</Button>
                <Button onClick={handleAddUser}>Add User</Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {isEditingUser && editingUserId && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
              <h2 className="text-xl font-semibold mb-4">Edit User</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input type="text" id="first_name" name="first_name" value={editingUserData.first_name} onChange={handleEditingInputChange} />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input type="text" id="last_name" name="last_name" value={editingUserData.last_name} onChange={handleEditingInputChange} />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select id="role" name="role" value={editingUserData.role} onValueChange={(value) => setEditingUserData(prev => ({ ...prev, role: value as UserRole }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="helper">Helper</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="secondary" onClick={() => setIsEditingUser(false)}>Cancel</Button>
                <Button onClick={handleUpdateUser}>Update User</Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        {isDeletingUser && deletingUserId && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
              <h2 className="text-xl font-semibold mb-4">Delete User</h2>
              <p>Are you sure you want to delete this user?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="secondary" onClick={handleCancelDeleteUser}>Cancel</Button>
                <Button variant="destructive" onClick={handleConfirmDeleteUser}>Delete User</Button>
              </div>
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {isSendingMessage && messageRecipient && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-96">
              <h2 className="text-xl font-semibold mb-4">Send Message</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input type="text" id="subject" name="subject" value={messageSubject} onChange={handleSendingInputChange} />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" value={messageContent} onChange={handleSendingInputChange} rows={5} />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="secondary" onClick={() => setIsSendingMessage(false)}>Cancel</Button>
                <Button onClick={handleSendAdminMessage}>Send Message</Button>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Complaint Details</h2>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <p>{selectedComplaint.title}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p>{selectedComplaint.description}</p>
                </div>
                <div>
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea id="feedback" value={complaintFeedback} onChange={handleFeedbackChange} rows={4} />
                </div>
                <div>
                  <Label htmlFor="followUp">Follow Up</Label>
                  <Textarea id="followUp" value={complaintFollowUp} onChange={handleFollowUpChange} rows={4} />
                </div>
                <div>
                  <Label>Attachments</Label>
                  {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 ? (
                    <div className="flex space-x-2">
                      {selectedComplaint.attachments.map((url: string) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          View Attachment
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p>No attachments</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="upload">Upload Attachments</Label>
                  <Input type="file" id="upload" multiple onChange={handleFileSelect} />
                  {filePreviews.length > 0 && (
                    <div className="flex space-x-2 mt-2">
                      {filePreviews.map((preview, index) => (
                        <img key={index} src={preview} alt={`Preview ${index}`} className="h-16 w-16 object-cover rounded" />
                      ))}
                    </div>
                  )}
                  {uploadProgress > 0 && (
                    <progress value={uploadProgress} max="100" className="w-full"></progress>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>Cancel</Button>
                {selectedComplaint.status !== 'resolved' ? (
                  <>
                    <Button onClick={handleResolveComplaint} disabled={isResolvingComplaint}>
                      {isResolvingComplaint ? "Resolving..." : "Resolve Complaint"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleReopenComplaint} disabled={isReopeningComplaint}>
                    {isReopeningComplaint ? "Reopening..." : "Reopen Complaint"}
                  </Button>
                )}
                <Button onClick={handleUploadAttachments} disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload Attachments"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Attachments Modal */}
        {isViewingAttachments && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Attachments</h2>
              <div className="space-y-4">
                {selectedAttachments.map((url: string) => (
                  <div key={url} className="flex items-center justify-between">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      View Attachment
                    </a>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAttachment(url)}>Delete</Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="secondary" onClick={() => setIsViewingAttachments(false)}>Close</Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Attachment Modal */}
        {isDeletingAttachment && attachmentToDelete && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
              <h2 className="text-xl font-semibold mb-4">Delete
