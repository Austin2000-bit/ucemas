import { SystemLogs } from "@/utils/systemLogs";

export interface RideRequest {
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

class RideService {
  private static instance: RideService;
  private rideRequests: RideRequest[] = [];

  private constructor() {
    this.loadRideRequests();
  }

  public static getInstance(): RideService {
    if (!RideService.instance) {
      RideService.instance = new RideService();
    }
    return RideService.instance;
  }

  private loadRideRequests() {
    try {
      const stored = localStorage.getItem("rideRequests");
      this.rideRequests = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading ride requests:", error);
      this.rideRequests = [];
    }
  }

  private saveRideRequests() {
    try {
      localStorage.setItem("rideRequests", JSON.stringify(this.rideRequests));
    } catch (error) {
      console.error("Error saving ride requests:", error);
    }
  }

  public createRideRequest(ride: Omit<RideRequest, "id" | "timestamp" | "status">): RideRequest {
    const newRide: RideRequest = {
      ...ride,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: "Pending"
    };

    this.rideRequests.push(newRide);
    this.saveRideRequests();
    return newRide;
  }

  public getPendingRides(): RideRequest[] {
    return this.rideRequests.filter(ride => ride.status === "Pending");
  }

  public getDriverRides(driverId: string): RideRequest[] {
    return this.rideRequests.filter(ride => ride.driverId === driverId);
  }

  public acceptRide(rideId: string, driverId: string, driverName: string): boolean {
    const rideIndex = this.rideRequests.findIndex(ride => ride.id === rideId);
    if (rideIndex === -1) return false;

    this.rideRequests[rideIndex] = {
      ...this.rideRequests[rideIndex],
      status: "Accepted",
      driverId,
      driverName
    };

    this.saveRideRequests();
    return true;
  }

  public rejectRide(rideId: string, driverId: string, driverName: string): boolean {
    const rideIndex = this.rideRequests.findIndex(ride => ride.id === rideId);
    if (rideIndex === -1) return false;

    this.rideRequests[rideIndex] = {
      ...this.rideRequests[rideIndex],
      status: "Rejected",
      driverId,
      driverName
    };

    this.saveRideRequests();
    return true;
  }

  public getRideStats(driverId: string) {
    const driverRides = this.getDriverRides(driverId);
    const completedRides = driverRides.filter(ride => ride.status === "Completed").length;
    const rejectedRides = driverRides.filter(ride => ride.status === "Rejected").length;
    const totalRides = driverRides.length;

    return {
      totalRides,
      completedRides,
      rejectedRides,
      acceptanceRate: totalRides > 0 ? ((completedRides / totalRides) * 100) : 0,
      averageRating: 4.5 // This would come from a ratings system in a real app
    };
  }
}

export const rideService = RideService.getInstance(); 