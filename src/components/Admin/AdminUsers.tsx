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
  DialogDescription,
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
import { Download, Search, UserPlus, MessageSquare, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import HelperStudentAssignment from "./HelperStudentAssignment";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  disability_type?: string;
  bank_account?: string;
  bank_account_number?: string;
  assistant_type?: string;
  assistant_specialization?: string;
  assistant_level?: string;
  profile_picture?: string;
  application_letter?: string;
  created_at?: string;
  last_login?: string;
}

interface Assignment {
  id: string;
  student_id: string;
  helper_id: string;
  status: string;
  created_at: string;
  student?: User;
  helper?: User;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    phone: "",
    disability_type: "",
    assistant_type: "",
    assistant_specialization: "",
    assistant_level: "",
    bank_account: "",
    bank_account_number: "",
  });

  // Load users and assignments from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');

        if (usersError) throw usersError;

        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('helper_student_assignments')
          .select('*');

        if (assignmentsError) throw assignmentsError;

        const populatedAssignments = (assignmentsData || []).map(assignment => {
          const student = usersData?.find(u => u.id === assignment.student_id);
          const helper = usersData?.find(u => u.id === assignment.helper_id);
          return { ...assignment, student, helper };
        });

        setUsers(usersData || []);
        setAssignments(populatedAssignments);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleMessage = (user: User) => {
    setSelectedUserForMessage(user);
    setIsMessageDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== selectedUser.id));
      setIsDeleteDialogOpen(false);

      SystemLogs.addLog(
        "User Deletion",
        `User ${selectedUser.first_name} ${selectedUser.last_name} (${selectedUser.email}) was deleted`,
        "admin",
        "admin"
      );

      toast({
        title: "User Deleted",
        description: `User ${selectedUser.first_name} ${selectedUser.last_name} has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadData = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Role,Phone,Additional Info\n"
      + data.map(user => {
          const additionalInfo = user.role === "helper" 
            ? `Type: ${user.assistant_type || "-"}, Level: ${user.assistant_level || "-"}, Specialization: ${user.assistant_specialization || "-"}, Bank: ${user.bank_account || "-"}, Account: ${user.bank_account_number || "-"}`
            : user.role === "student"
            ? `Disability: ${user.disability_type || "-"}`
            : "";
          return `"${user.first_name} ${user.last_name}","${user.email}","${user.role}","${user.phone || "-"}","${additionalInfo}"`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "assistants") return user.role === "helper" && matchesSearch;
    if (activeTab === "students") return user.role === "student" && matchesSearch;
    if (activeTab === "drivers") return user.role === "driver" && matchesSearch;
    return matchesSearch;
  });

  const handleAddUser = async () => {
    // Basic validation
    if (!newUser.email || !newUser.first_name || !newUser.last_name || !newUser.role) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          ...newUser,
          // Ensure we don't send empty strings for optional fields
          phone: newUser.phone || undefined,
          disability_type: newUser.disability_type || undefined,
          assistant_type: newUser.assistant_type || undefined,
          assistant_specialization: newUser.assistant_specialization || undefined,
          assistant_level: newUser.assistant_level || undefined,
          bank_account: newUser.bank_account || undefined,
          bank_account_number: newUser.bank_account_number || undefined,
        }
      });

      if (error) throw new Error(error.message);

      // Add the new user to the local state to update the UI
      setUsers([...users, data.user.user]);
      setIsAddUserDialogOpen(false);
      setNewUser({ // Reset form
        first_name: "",
        last_name: "",
        email: "",
        role: "",
        phone: "",
        disability_type: "",
        assistant_type: "",
        assistant_specialization: "",
        assistant_level: "",
        bank_account: "",
        bank_account_number: "",
      });

      SystemLogs.addLog("User Creation", `New user ${newUser.email} created by admin.`, "admin", "admin");

      toast({
        title: "User Created",
        description: `User ${newUser.email} has been successfully created.`,
      });

    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading users...</div>;
  }

  const renderUserTable = (users: User[]) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadData(users, `${activeTab}-users`)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Button>
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => setIsAddUserDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Role</TableHead>
                  <TableHead className="whitespace-nowrap">Phone</TableHead>
                  <TableHead className="whitespace-nowrap">Additional Info</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.profile_picture ? (
                            <img
                              src={user.profile_picture}
                              alt={`${user.first_name} ${user.last_name}`}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {user.first_name[0]}{user.last_name[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Joined {new Date(user.created_at || "").toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === "admin" ? "default" :
                          user.role === "driver" ? "secondary" :
                          user.role === "helper" ? "outline" :
                          "destructive"
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{user.phone || "-"}</TableCell>
                      <TableCell>
                        {user.role === "helper" && (
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Type:</span> {user.assistant_type || "-"}</p>
                            <p><span className="font-medium">Level:</span> {user.assistant_level || "-"}</p>
                            <p><span className="font-medium">Specialization:</span> {user.assistant_specialization || "-"}</p>
                          </div>
                        )}
                        {user.role === "student" && (
                          <div className="text-sm">
                            <p><span className="font-medium">Disability:</span> {user.disability_type || "-"}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMessage(user)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssignmentsTable = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => downloadData(assignments, "assignments")}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Assignments
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Disability Type</TableHead>
                  <TableHead className="whitespace-nowrap">Assistant</TableHead>
                  <TableHead className="whitespace-nowrap">Specialization</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Assigned Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="whitespace-nowrap">
                        {assignment.student?.first_name} {assignment.student?.last_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {assignment.student?.disability_type || "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {assignment.helper?.first_name} {assignment.helper?.last_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {assignment.helper?.assistant_specialization || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No assignments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderUserTable(filteredUsers)}
        </TabsContent>

        <TabsContent value="assistants">
          {renderUserTable(users.filter(user =>
            user.role === "helper" &&
            (
              user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          ))}
        </TabsContent>

        <TabsContent value="students">
          {renderUserTable(users.filter(user =>
            user.role === "student" &&
            (
              user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          ))}
        </TabsContent>

        <TabsContent value="drivers">
          {renderUserTable(users.filter(user =>
            user.role === "driver" &&
            (
              user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            )
          ))}
        </TabsContent>

        <TabsContent value="assignments">
          <HelperStudentAssignment />
        </TabsContent>
      </Tabs>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View complete information for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">First Name</p>
                  <p className="text-sm">{selectedUser.first_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Name</p>
                  <p className="text-sm">{selectedUser.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm">{selectedUser.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Disability Type</p>
                  <p className="text-sm">{selectedUser.disability_type || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created At</p>
                  <p className="text-sm">{new Date(selectedUser.created_at || "").toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Login</p>
                  <p className="text-sm">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : "-"}</p>
                </div>
              </div>

              {selectedUser.role === "helper" && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Assistant Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Assistant Type</p>
                      <p className="text-sm">{selectedUser.assistant_type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Level</p>
                      <p className="text-sm">{selectedUser.assistant_level || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Specialization</p>
                      <p className="text-sm">{selectedUser.assistant_specialization || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bank</p>
                      <p className="text-sm">{selectedUser.bank_account || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Account Number</p>
                      <p className="text-sm">{selectedUser.bank_account_number || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {(selectedUser.profile_picture || selectedUser.application_letter) && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Attachments</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.profile_picture && (
                      <div>
                        <p className="text-sm font-medium">Profile Picture</p>
                        <img 
                          src={selectedUser.profile_picture} 
                          alt="Profile" 
                          className="w-24 h-24 object-cover rounded"
                        />
                      </div>
                    )}
                    {selectedUser.application_letter && (
                      <div>
                        <p className="text-sm font-medium">Application Letter</p>
                        <a 
                          href={selectedUser.application_letter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Letter
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.first_name} {selectedUser?.last_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Message {selectedUserForMessage?.first_name} {selectedUserForMessage?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1">
            <MessageSystem 
              recipient={selectedUserForMessage?.email} 
              onClose={() => setIsMessageDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new user account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="helper">Assistant</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newUser.role === "student" && (
              <div className="space-y-2">
                <Label htmlFor="disability_type">Disability Type</Label>
                <Input
                  id="disability_type"
                  value={newUser.disability_type}
                  onChange={(e) => setNewUser({ ...newUser, disability_type: e.target.value })}
                />
              </div>
            )}

            {newUser.role === "helper" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assistant_type">Assistant Type</Label>
                    <Input
                      id="assistant_type"
                      value={newUser.assistant_type}
                      onChange={(e) => setNewUser({ ...newUser, assistant_type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assistant_level">Level</Label>
                    <Input
                      id="assistant_level"
                      value={newUser.assistant_level}
                      onChange={(e) => setNewUser({ ...newUser, assistant_level: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assistant_specialization">Specialization</Label>
                  <Input
                    id="assistant_specialization"
                    value={newUser.assistant_specialization}
                    onChange={(e) => setNewUser({ ...newUser, assistant_specialization: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Bank</Label>
                    <Input
                      id="bank_account"
                      value={newUser.bank_account}
                      onChange={(e) => setNewUser({ ...newUser, bank_account: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">Account Number</Label>
                    <Input
                      id="bank_account_number"
                      value={newUser.bank_account_number}
                      onChange={(e) => setNewUser({ ...newUser, bank_account_number: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers; 