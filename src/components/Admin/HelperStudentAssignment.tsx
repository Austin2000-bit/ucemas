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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { User, HelperStudentAssignment as Assignment } from "@/types";
import { SystemLogs } from "@/utils/systemLogs";
import CreateAssignment from "@/components/Admin/CreateAssignment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

const HelperStudentAssignment = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      // Get the current auth session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw usersError;
      }

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('helper_student_assignments')
        .select('*');

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        throw assignmentsError;
      }

      setUsers(usersData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: `Failed to load assignments data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  const handleToggleStatus = async (assignmentId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      // Check session before updating
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from('helper_student_assignments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', assignmentId);

      if (error) {
        console.error("Error updating assignment status:", error);
        if (error.code === '42501') {
          throw new Error("Permission denied. You may not have the right access level to update assignments.");
        }
        throw error;
      }

      // Update local state
      setAssignments(prevAssignments => 
        prevAssignments.map(a => 
          a.id === assignmentId ? { ...a, status: newStatus } : a
        )
      );

      // Log the action
      const assignment = assignments.find(a => a.id === assignmentId);
      if (assignment) {
        const helperName = getUserName(assignment.helper_id);
        const studentName = getUserName(assignment.student_id);
        
        SystemLogs.addLog(
          "Assignment updated",
          `Assignment for helper ${helperName} and student ${studentName} status changed to ${newStatus}`,
          "admin",
          "admin"
        );
      }

      toast({
        title: "Status Updated",
        description: `Assignment status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: `Failed to update assignment status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchData();
  };

  const getHelpers = () => {
    return users.filter(user => user.role === 'helper');
  };

  const getStudents = () => {
    return users.filter(user => user.role === 'student');
  };

  const handleDeleteClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete?.id) return;

    try {
      // Check session before deleting
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('helper_student_assignments')
        .delete()
        .eq('id', assignmentToDelete.id);

      if (error) {
        console.error("Error deleting assignment:", error);
        if (error.code === '42501') {
          throw new Error("Permission denied. You may not have the right access level to delete assignments.");
        }
        throw error;
      }

      // Update local state
      setAssignments(prevAssignments => 
        prevAssignments.filter(a => a.id !== assignmentToDelete.id)
      );

      // Log the action
      const helperName = getUserName(assignmentToDelete.helper_id);
      const studentName = getUserName(assignmentToDelete.student_id);
      
      SystemLogs.addLog(
        "Assignment deleted",
        `Assignment for helper ${helperName} and student ${studentName} has been deleted`,
        "admin",
        "admin"
      );

      toast({
        title: "Assignment Deleted",
        description: "The assignment has been successfully deleted.",
      });

      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: `Failed to delete assignment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Helper-Student Assignments</h2>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "Create New Assignment"}
        </Button>
      </div>

      {showCreateForm && (
        <CreateAssignment 
          onSuccess={handleCreateSuccess} 
          helpers={getHelpers()}
          students={getStudents()}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <div className="text-center py-8">Loading assignments...</div>
        ) : assignments.length > 0 ? (
          <Table>
            <TableCaption>List of helper-student assignments</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Helper</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map(assignment => (
                <TableRow key={assignment.id}>
                  <TableCell>{getUserName(assignment.helper_id)}</TableCell>
                  <TableCell>{getUserName(assignment.student_id)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={assignment.status === "active" ? "default" : "secondary"}
                    >
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignment.created_at 
                      ? new Date(assignment.created_at).toLocaleDateString() 
                      : "N/A"}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(assignment.id!, assignment.status)}
                    >
                      {assignment.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(assignment)}
                      className="bg-black hover:bg-gray-800 text-white hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No assignments found. Create your first assignment using the button above.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
              {assignmentToDelete && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p><strong>Helper:</strong> {getUserName(assignmentToDelete.helper_id)}</p>
                  <p><strong>Student:</strong> {getUserName(assignmentToDelete.student_id)}</p>
                  <p><strong>Status:</strong> {assignmentToDelete.status}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteConfirm}
              className="bg-black hover:bg-gray-800 text-white hover:text-white"
            >
              Delete Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelperStudentAssignment;
