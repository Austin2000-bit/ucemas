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
import { Download, Search, UserPlus, MessageSquare, Trash2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HelperStudentAssignment from "./HelperStudentAssignment";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  disability_type?: string;
  services_needed?: string[];
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

        const { data: assignmentsData, error: assignmentsError } = await supabase.from("helper_student_assignments").select("*");
        if (assignmentsError) throw assignmentsError;

        const populatedAssignments = (assignmentsData || []).map((assignment) => {
          const student = usersData?.find((u) => u.id === assignment.student_id);
          const helper = usersData?.find((u) => u.id === assignment.helper_id);
          return { ...assignment, student, helper };
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
    if (activeTab === "assistants") return user.role === "helper" && matchesSearch;
    if (activeTab === "students") return user.role === "student" && matchesSearch;
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
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Services Needed</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.first_name} {user.last_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{user.phone}</TableCell>
            <TableCell>
              {user.role === "student"
                ? user.services_needed?.length
                    ? user.services_needed.join(", ")
                    : (user.disability_type && disabilityServices[user.disability_type]?.join(", ")) || "-"
                : "-"}
            </TableCell>
            <TableCell className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleView(user)}>
                <Eye />
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="assistants">Assistants</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderUserTable(filteredUsers)}</TabsContent>
        <TabsContent value="assistants">{renderUserTable(filteredUsers.filter(u => u.role === "helper"))}</TabsContent>
        <TabsContent value="students">{renderUserTable(filteredUsers.filter(u => u.role === "student"))}</TabsContent>
        <TabsContent value="drivers">{renderUserTable(filteredUsers.filter(u => u.role === "driver"))}</TabsContent>
        <TabsContent value="assignments"><HelperStudentAssignment /></TabsContent>
      </Tabs>

      {/* View, Delete, Message dialogs */}
      {isViewDialogOpen && selectedUser && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View User</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p><b>Name:</b> {selectedUser.first_name} {selectedUser.last_name}</p>
              <p><b>Email:</b> {selectedUser.email}</p>
              <p><b>Role:</b> {selectedUser.role}</p>
              <p><b>Phone:</b> {selectedUser.phone}</p>
              {selectedUser.role === "student" && selectedUser.services_needed && (
                <p><b>Services Needed:</b> {selectedUser.services_needed.join(", ")}</p>
              )}
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
          user={selectedUserForMessage} 
          onClose={() => setIsMessageDialogOpen(false)} 
        />
      )}
    </div>
  );
};

export default AdminUsers;
