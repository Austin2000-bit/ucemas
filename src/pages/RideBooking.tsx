import { useState } from "react";
import { useAuth } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { SystemLogs } from "@/utils/systemLogs";
import GoogleMap from "@/components/GoogleMap";
import DriverRides from "@/components/DriverRides";

interface RideRequest {
  id: string;
  studentId: string;
  pickupLocation: string;
  destination: string;
  status: "Pending" | "Accepted" | "Rejected" | "In Progress" | "Completed" | "Cancelled";
  timestamp: number;
  estimatedTime: string;
  vehicleType: string;
  distance?: string;
  driverId?: string;
  driverName?: string;
}

const RideBooking = () => {
  const { user } = useAuth();
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [distance, setDistance] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFindDriver = () => {
    if (!pickupLocation || !destination) {
      toast({
        title: "Error",
        description: "Please enter both pickup and destination locations.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to request a ride.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const rideRequests = JSON.parse(localStorage.getItem("rideRequests") || "[]");
      console.log("Current ride requests:", rideRequests);

      const newRide: RideRequest = {
        id: Date.now().toString(),
        studentId: user.id,
        pickupLocation,
        destination,
        status: "Pending",
        timestamp: Date.now(),
        estimatedTime,
        vehicleType: "Standard",
        distance,
      };

      console.log("Creating new ride request:", newRide);
      rideRequests.push(newRide);
      localStorage.setItem("rideRequests", JSON.stringify(rideRequests));
      console.log("Updated ride requests:", rideRequests);

      SystemLogs.addLog(
        "Ride requested",
        `Student requested ride from ${pickupLocation} to ${destination}`,
        user.id,
        user.role
      );

      toast({
        title: "Ride requested!",
        description: "Your ride request has been sent to available drivers.",
      });

      setPickupLocation("");
      setDestination("");
      setEstimatedTime("");
      setDistance("");
    } catch (error) {
      console.error("Error requesting ride:", error);
      toast({
        title: "Error",
        description: "Failed to request ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role === "driver") {
    return <DriverRides />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-500 text-white p-4 text-center text-xl font-bold">
            BOOK A RIDE
          </div>
          
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup Location</label>
              <Input
                placeholder="Enter pickup location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <Input
                placeholder="Enter destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <GoogleMap
              pickupLocation={pickupLocation}
              destination={destination}
              onRouteCalculated={(time, dist) => {
                setEstimatedTime(time);
                setDistance(dist);
              }}
            />

            {estimatedTime && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Estimated time</span>
                  <span className="text-sm font-bold">{estimatedTime}</span>
                </div>
                {distance && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium">Distance</span>
                    <span className="text-sm font-bold">{distance}</span>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleFindDriver}
              disabled={isLoading || !pickupLocation || !destination}
            >
              {isLoading ? "Finding driver..." : "Find Driver"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideBooking;

