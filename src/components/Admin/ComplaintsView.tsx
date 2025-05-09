
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
import { supabase } from "@/lib/supabase";
import { Complaint, User } from "@/types";

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-medium p-4">Complaints</h2>
      
      {isLoading ? (
        <div className="text-center py-8">Loading complaints...</div>
      ) : complaints.length > 0 ? (
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
                    {complaint.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-gray-500">No complaints found</div>
      )}
    </div>
  );
};

export default ComplaintsView;
