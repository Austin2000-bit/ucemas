
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Complaint, User } from "@/types";
import { SystemLogs } from "@/utils/systemLogs";
import { ScrollArea } from "@/components/ui/scroll-area";

const ComplaintsView = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch complaints
        const { data: complaintsData, error: complaintsError } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (complaintsError) {
          console.error("Error fetching complaints:", complaintsError);
          throw complaintsError;
        }

        // Fetch users to get names
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');

        if (usersError) {
          console.error("Error fetching users:", usersError);
          throw usersError;
        }

        setComplaints(complaintsData || []);
        setUsers(usersData || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : "Unknown User";
  };

  const getUserRole = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.role : "Unknown";
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    try {
      // First, check if complaint exists
      const { data: existingComplaint, error: fetchError } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', complaintId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching complaint:", fetchError);
        throw new Error("Could not find the complaint");
      }
      
      // Now update the complaint
      const { data, error } = await supabase
        .from('complaints')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', complaintId);

      if (error) {
        console.error("Error updating complaint status:", error);
        throw error;
      }

      // Update local state
      setComplaints(prevComplaints => 
        prevComplaints.map(complaint => 
          complaint.id === complaintId 
            ? { ...complaint, status: newStatus, updated_at: new Date().toISOString() } 
            : complaint
        )
      );

      // Also update in localStorage as a fallback
      const localComplaints = JSON.parse(localStorage.getItem("complaints") || "[]");
      const updatedLocalComplaints = localComplaints.map((c: any) => 
        c.id === complaintId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
      );
      localStorage.setItem("complaints", JSON.stringify(updatedLocalComplaints));

      // Log the action
      SystemLogs.addLog(
        "Complaint status updated",
        `Complaint status updated to ${newStatus}`,
        "admin",
        "admin"
      );

      toast({
        title: "Status Updated",
        description: `Complaint status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to update complaint status",
        variant: "destructive",
      });
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-medium p-4">Complaints</h2>
      
      {isLoading ? (
        <div className="text-center py-8">Loading complaints...</div>
      ) : complaints.length > 0 ? (
        <ScrollArea className="h-[500px]">
          <Table>
            <TableCaption>List of submitted complaints</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map(complaint => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.title}</TableCell>
                  <TableCell className="max-w-md truncate">{complaint.description}</TableCell>
                  <TableCell>{getUserName(complaint.user_id)}</TableCell>
                  <TableCell>{getUserRole(complaint.user_id)}</TableCell>
                  <TableCell>
                    {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        complaint.status === "resolved" ? "outline" : 
                        complaint.status === "in_progress" ? "default" : 
                        "secondary"
                      }
                    >
                      {formatStatus(complaint.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Update Status</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(complaint.id!, 'pending')}
                          disabled={complaint.status === 'pending'}
                        >
                          Set to Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(complaint.id!, 'in_progress')}
                          disabled={complaint.status === 'in_progress'}
                        >
                          Set to In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleUpdateStatus(complaint.id!, 'resolved')}
                          disabled={complaint.status === 'resolved'}
                        >
                          Set to Resolved
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-gray-500">No complaints found</div>
      )}
    </div>
  );
};

export default ComplaintsView;
