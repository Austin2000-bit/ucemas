import { useState, useEffect } from "react";
import { useAuth } from "@/utils/auth";
import { Button } from "@/components/ui/button";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface RideRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  pickupLocation: string;
  destination: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "completed" | "declined";
  disabilityType: string;
  additionalNotes?: string;
}

const Driver = () => {
  const { user } = useAuth();
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);

  useEffect(() => {
    // Load ride requests from localStorage
    const storedRequests = JSON.parse(localStorage.getItem("rideRequests") || "[]");
    setRideRequests(storedRequests);
  }, []);

  const handleRideAction = (requestId: string, action: "accept" | "decline" | "complete") => {
    const updatedRequests = rideRequests.map(request => {
      if (request.id === requestId) {
        return {
          ...request,
          status: action === "accept" ? "accepted" : 
                  action === "decline" ? "declined" : "completed"
        };
      }
      return request;
    });

    localStorage.setItem("rideRequests", JSON.stringify(updatedRequests));
    setRideRequests(updatedRequests);

    toast({
      title: "Ride Request Updated",
      description: `Ride request has been ${action}ed.`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar title="Driver Dashboard" />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Driver Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Information</CardTitle>
              <CardDescription>Your driver profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {user?.name}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Role:</span> Driver</p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ride Statistics</CardTitle>
              <CardDescription>Your ride performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">
                    {rideRequests.filter(r => r.status === "completed").length}
                  </p>
                  <p className="text-sm text-gray-500">Completed Rides</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {rideRequests.filter(r => r.status === "pending").length}
                  </p>
                  <p className="text-sm text-gray-500">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => {
                  // Refresh ride requests
                  const storedRequests = JSON.parse(localStorage.getItem("rideRequests") || "[]");
                  setRideRequests(storedRequests);
                }}>
                  Refresh Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ride Requests Table */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Ride Requests</CardTitle>
              <CardDescription>Manage student ride requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Disability</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rideRequests.length > 0 ? (
                      rideRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.studentName}</p>
                              <p className="text-sm text-gray-500">{request.studentEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{request.pickupLocation}</TableCell>
                          <TableCell>{request.destination}</TableCell>
                          <TableCell>
                            <div>
                              <p>{request.date}</p>
                              <p className="text-sm text-gray-500">{request.time}</p>
                            </div>
                          </TableCell>
                          <TableCell>{request.disabilityType}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                request.status === "accepted" ? "default" :
                                request.status === "pending" ? "secondary" :
                                request.status === "completed" ? "success" :
                                "destructive"
                              }
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleRideAction(request.id, "accept")}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRideAction(request.id, "decline")}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {request.status === "accepted" && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleRideAction(request.id, "complete")}
                              >
                                Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No ride requests found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Driver; 