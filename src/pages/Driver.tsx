import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { supabase } from "@/lib/supabase";
import { websocketService, RideUpdate } from "@/services/websocketService";

// Define a new type for the local storage ride requests
interface LocalRideRequest {
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
  const [rideRequests, setRideRequests] = useState<LocalRideRequest[]>([]);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  // Helper function to safely convert status string to the allowed literal types
  const validateStatus = (status: string): "pending" | "accepted" | "completed" | "declined" => {
    if (status === "accepted") return "accepted";
    if (status === "completed") return "completed";
    if (status === "declined" || status === "rejected") return "declined";
    return "pending"; // Default fallback
  };

  // Load ride requests from Supabase only
  const loadRideRequests = async () => {
    try {
      console.log('Loading ride requests for driver:', user?.id);
      
      // First, get available ride requests (not assigned to any driver)
      const { data: availableRequests, error: availableError } = await supabase
        .from('ride_requests')
        .select('*')
        .is('driver_id', null)
        .eq('status', 'pending');

      if (availableError) {
        console.error('Error fetching available requests:', availableError);
        throw availableError;
      }

      console.log('Available requests:', availableRequests);

      // Then, get ride requests assigned to this driver
      const { data: assignedRequests, error: assignedError } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('driver_id', user?.id);

      if (assignedError) {
        console.error('Error fetching assigned requests:', assignedError);
        throw assignedError;
      }

      console.log('Assigned requests:', assignedRequests);

      // Combine both sets of requests
      const allRequests = [...(availableRequests || []), ...(assignedRequests || [])];

      // Get student information for all requests
      const studentIds = [...new Set(allRequests.map(req => req.student_id))];
      let students: any[] = [];
      
      if (studentIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, disability_type')
          .in('id', studentIds);

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
        } else {
          students = studentsData || [];
        }
      }

      // Convert DB requests to LocalRideRequest format
      const formattedRequests: LocalRideRequest[] = allRequests.map(dbReq => {
        const student = students.find(s => s.id === dbReq.student_id);
        return {
        id: dbReq.id,
          studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
          studentEmail: student?.email || 'No email',
        pickupLocation: dbReq.pickup_location,
        destination: dbReq.destination,
        date: new Date(dbReq.created_at || Date.now()).toLocaleDateString(),
        time: new Date(dbReq.created_at || Date.now()).toLocaleTimeString(),
        status: validateStatus(dbReq.status),
          disabilityType: student?.disability_type || "Not specified",
          additionalNotes: dbReq.driver_id ? "Assigned to you" : "Available for pickup"
        };
      });

      console.log('Formatted requests:', formattedRequests);
      setRideRequests(formattedRequests);
    } catch (dbError) {
      console.error("Error loading ride requests from database:", dbError);
      setRideRequests([]);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadRideRequests();
    }
  }, [user?.id]);

  // WebSocket subscription for real-time ride updates
  useEffect(() => {
    if (!user?.id) return;
    
    const handleRideUpdate = (update: RideUpdate) => {
      console.log('Driver received ride update:', update);
      
      // Reload ride requests when there are changes
            loadRideRequests();
      
      // Show toast notifications for new ride requests
      if (update.type === 'ride_created') {
        toast({
          title: "New Ride Request",
          description: "A new ride request is available for pickup.",
        });
      }
    };
    
    // Subscribe to ride updates for this driver
    websocketService.subscribeToRideUpdates(user.id, 'driver', handleRideUpdate);
    
    return () => {
      websocketService.unsubscribeFromRideUpdates(user.id, handleRideUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        result.onchange = () => setLocationPermission(result.state);
      });
    }
  }, []);

  const handleRideAction = async (requestId: string, action: "accept" | "decline" | "complete") => {
    try {
      // Fetch the current ride data for debugging
      const { data: ride, error: fetchError } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !ride) {
        alert("Could not fetch ride data for id: " + requestId);
        const allRides = await supabase.from('ride_requests').select('*');
        console.log("All rides in DB:", allRides);
        throw new Error("Could not fetch ride data.");
      }
      // Log for debugging
      alert("Ride before action: " + JSON.stringify(ride));
      console.log("Ride before action:", ride);

      const statusForDb = action === "decline" ? "rejected" : action === "accept" ? "accepted" : "completed";
      const updateData: any = {
          status: statusForDb,
          updated_at: new Date().toISOString()
      };
      if (action === "accept") {
        updateData.driver_id = user?.id;
      }
      // Only require status to be pending
      let query = supabase.from('ride_requests').update(updateData).eq('id', requestId);
      if (action === "accept") {
        query = query.eq('status', 'pending');
      }
      const { error, data } = await query.select();
      if (error || !data || data.length === 0) {
        alert("Update failed. Ride may not be pending or may not exist. See console for details.");
        throw new Error("Ride could not be accepted. It may have already been taken or is not pending.");
      }
      await loadRideRequests();
      toast({
        title: "Ride Request Updated",
        description: `Ride request has been ${action}ed successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update ride request.",
        variant: "destructive"
      });
    }
  };

  // Test function to create a sample ride request
  const createTestRideRequest = async () => {
    try {
      // First, get a student user to create a ride request for
      const { data: students, error: studentsError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'student')
        .limit(1);

      if (studentsError || !students || students.length === 0) {
        toast({
          title: "Error",
          description: "No students found to create test ride request",
          variant: "destructive"
        });
        return;
      }

      const testRequest = {
        student_id: students[0].id,
        pickup_location: "University Main Gate",
        destination: "Engineering Building",
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ride_requests')
        .insert([testRequest]);

      if (error) {
        console.error('Error creating test ride request:', error);
        toast({
          title: "Error",
          description: "Failed to create test ride request",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Test ride request created successfully",
        });
        await loadRideRequests();
      }
    } catch (error) {
      console.error('Error in createTestRideRequest:', error);
      toast({
        title: "Error",
        description: "Failed to create test ride request",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {locationPermission !== 'granted' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4 text-center">
          <b>Location access is required for live tracking.</b><br />
          Please enable location services in your browser and allow access when prompted.<br />
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  () => window.location.reload(),
                  () => alert("Location access denied. Please allow location access for live tracking.")
                );
              }
            }}
          >
            Enable Location
          </button>
        </div>
      )}
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
                <p><span className="font-medium">Name:</span> {user ? `${user.first_name} ${user.last_name}` : "Loading..."}</p>
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
                <Button variant="outline" className="w-full" onClick={loadRideRequests}>
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
                            <div className="space-y-1">
                            <Badge
                              variant={
                                request.status === "accepted" ? "default" :
                                request.status === "pending" ? "secondary" :
                                request.status === "completed" ? "outline" :
                                "destructive"
                              }
                            >
                              {request.status}
                            </Badge>
                              {request.status === "pending" && (
                                <div className="text-xs text-blue-600 font-medium">
                                  Available for pickup
                                </div>
                              )}
                              {request.status === "accepted" && (
                                <div className="text-xs text-green-600 font-medium">
                                  Assigned to you
                                </div>
                              )}
                            </div>
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
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  if (confirm("Are you sure you want to mark this ride as completed?")) {
                                    handleRideAction(request.id, "complete");
                                  }
                                }}
                              >
                                Complete Ride
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
