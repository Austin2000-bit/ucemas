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

interface RideRequest {
  id: string;
  studentId: string;
  pickupLocation: string;
  destination: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  timestamp: number;
  estimatedTime: string;
  vehicleType: string;
}

const AdminRideRequests = () => {
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Load ride requests and users from localStorage
    const storedRideRequests = JSON.parse(localStorage.getItem("rideRequests") || "[]");
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    
    setRideRequests(storedRideRequests);
    setUsers(storedUsers);
  }, []);

  const getStudentName = (studentId: string) => {
    const student = users.find(u => u.id === studentId);
    return student ? `${student.firstname} ${student.lastname}` : 'Unknown Student';
  };

  const handleUpdateStatus = (requestId: string, newStatus: RideRequest["status"]) => {
    const updatedRequests = rideRequests.map(request => 
      request.id === requestId ? { ...request, status: newStatus } : request
    );
    
    localStorage.setItem("rideRequests", JSON.stringify(updatedRequests));
    setRideRequests(updatedRequests);
    
    toast({
      title: "Status Updated",
      description: `Ride request status updated to ${newStatus}`,
    });
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-3">Ride Requests</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <Table>
          <TableCaption>Recent ride requests</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rideRequests.length > 0 ? (
              rideRequests
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{getStudentName(request.studentId)}</TableCell>
                    <TableCell>{request.pickupLocation}</TableCell>
                    <TableCell>{request.destination}</TableCell>
                    <TableCell>{request.vehicleType}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={request.status === "Completed" ? "default" : "outline"}
                        className={
                          request.status === "Completed" ? "bg-green-500" :
                          request.status === "In Progress" ? "bg-blue-500" :
                          request.status === "Cancelled" ? "bg-red-500" :
                          "bg-yellow-500"
                        }
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {request.status === "Pending" && (
                          <>
                            <Button 
                              size="sm"
                              onClick={() => handleUpdateStatus(request.id, "In Progress")}
                            >
                              Start
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(request.id, "Cancelled")}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {request.status === "In Progress" && (
                          <Button 
                            size="sm"
                            onClick={() => handleUpdateStatus(request.id, "Completed")}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No ride requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminRideRequests; 