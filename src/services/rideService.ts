
import { supabase } from "@/lib/supabase";
import { RideRequest } from "@/types";
import { SystemLogs } from "@/utils/systemLogs";

class RideService {
  private static instance: RideService;

  private constructor() {}

  public static getInstance(): RideService {
    if (!RideService.instance) {
      RideService.instance = new RideService();
    }
    return RideService.instance;
  }

  public async createRideRequest(ride: Omit<RideRequest, "id" | "status" | "created_at" | "updated_at">): Promise<RideRequest | null> {
    try {
      const newRide: Omit<RideRequest, "id" | "created_at" | "updated_at"> = {
        ...ride,
        status: "pending"
      };

      const { data, error } = await supabase
        .from('ride_requests')
        .insert([newRide])
        .select()
        .single();

      if (error) {
        console.error("Error creating ride request:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating ride request:", error);
      return null;
    }
  }

  public async getPendingRides(): Promise<RideRequest[]> {
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('status', 'pending');

      if (error) {
        console.error("Error getting pending rides:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error getting pending rides:", error);
      return [];
    }
  }

  public async getDriverRides(driverId: string): Promise<RideRequest[]> {
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('driver_id', driverId);

      if (error) {
        console.error("Error getting driver rides:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error getting driver rides:", error);
      return [];
    }
  }

  public async acceptRide(rideId: string, driverId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ 
          status: 'accepted',
          driver_id: driverId
        })
        .eq('id', rideId);

      if (error) {
        console.error("Error accepting ride:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error accepting ride:", error);
      return false;
    }
  }

  public async rejectRide(rideId: string, driverId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ 
          status: 'rejected',
          driver_id: driverId
        })
        .eq('id', rideId);

      if (error) {
        console.error("Error rejecting ride:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error rejecting ride:", error);
      return false;
    }
  }

  public async completeRide(rideId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'completed' })
        .eq('id', rideId);

      if (error) {
        console.error("Error completing ride:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error completing ride:", error);
      return false;
    }
  }

  public async getRideStats(driverId: string) {
    try {
      const driverRides = await this.getDriverRides(driverId);
      const completedRides = driverRides.filter(ride => ride.status === "completed").length;
      const rejectedRides = driverRides.filter(ride => ride.status === "rejected").length;
      const totalRides = driverRides.length;

      return {
        totalRides,
        completedRides,
        rejectedRides,
        acceptanceRate: totalRides > 0 ? ((completedRides / totalRides) * 100) : 0,
        averageRating: 4.5 // This would come from a ratings system in a real app
      };
    } catch (error) {
      console.error("Error getting ride stats:", error);
      return {
        totalRides: 0,
        completedRides: 0,
        rejectedRides: 0,
        acceptanceRate: 0,
        averageRating: 0
      };
    }
  }
}

export const rideService = RideService.getInstance();
