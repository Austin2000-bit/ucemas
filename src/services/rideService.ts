import { supabase } from '@/lib/supabase';
import { RideRequest, User } from '@/types';

// Interface for ride requests with additional properties for UI
export interface RideRequestWithDetails extends RideRequest {
  estimatedTime?: number;
  student_name?: string;
  driver_name?: string;
}

// Interface for nearby rides
export interface NearbyRide {
  id: string;
  driver_id: string;
  driver_name: string;
  location: {
    lat: number;
    lng: number;
  };
  vehicle_type: string;
  status: 'available' | 'busy';
  last_updated: string;
}

// Function to get nearby rides within a radius (in kilometers)
export const getNearbyRides = async (
  userLat: number,
  userLng: number,
  radiusKm: number = 5
): Promise<NearbyRide[]> => {
  try {
    // First, get all available drivers
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, first_name, last_name, current_location, vehicle_type, status')
      .eq('role', 'driver')
      .eq('status', 'available');

    if (driversError) {
      throw new Error(driversError.message);
    }

    // Filter drivers by distance
    const nearbyRides = drivers
      .filter(driver => {
        if (!driver.current_location) return false;
        
        const driverLat = driver.current_location.lat;
        const driverLng = driver.current_location.lng;
        
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          userLat,
          userLng,
          driverLat,
          driverLng
        );
        
        return distance <= radiusKm;
      })
      .map(driver => ({
        id: driver.id,
        driver_id: driver.id,
        driver_name: `${driver.first_name} ${driver.last_name}`,
        location: driver.current_location,
        vehicle_type: driver.vehicle_type || 'Bajaj',
        status: driver.status as 'available' | 'busy',
        last_updated: new Date().toISOString()
      }));

    return nearbyRides;
  } catch (error) {
    console.error('Error getting nearby rides:', error);
    throw error;
  }
};

// Function to update driver's location
export const updateDriverLocation = async (
  driverId: string,
  lat: number,
  lng: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        current_location: { lat, lng },
        location_updated_at: new Date().toISOString()
      })
      .eq('id', driverId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('Error updating driver location:', error);
    return false;
  }
};

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to convert degrees to radians
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Function to create a new ride request
export const createRideRequest = async (
  student_id: string, 
  pickup_location: string, 
  destination: string
): Promise<RideRequestWithDetails> => {
  try {
    const newRequest = {
      student_id,
      pickup_location,
      destination,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('ride_requests')
      .insert([newRequest])
      .select()
      .single();

    if (error) {
      console.error('Error creating ride request:', error);
      throw new Error(error.message);
    }

    // Add estimated time as a UI property (not stored in DB)
    return { 
      ...data, 
      estimatedTime: Math.floor(Math.random() * 20) + 5 // Random time between 5-25 minutes
    };
  } catch (error) {
    console.error('Error in createRideRequest:', error);
    throw error;
  }
};

// Function to get ride requests for a student
export const getStudentRideRequests = async (
  student_id: string
): Promise<RideRequestWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student ride requests:', error);
      throw new Error(error.message);
    }

    // Add estimated time as a UI property
    const requestsWithDetails = data.map(request => ({
      ...request,
      estimatedTime: Math.floor(Math.random() * 20) + 5
    }));

    return requestsWithDetails;
  } catch (error) {
    console.error('Error in getStudentRideRequests:', error);
    throw error;
  }
};

// Function to get available ride requests for drivers
export const getAvailableRideRequests = async (): Promise<RideRequestWithDetails[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching available ride requests:', error);
      throw new Error(error.message);
    }

    // Get all students to add names to requests
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('role', ['student']);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error(usersError.message);
    }

    // Add student names and estimated time to requests
    const requestsWithDetails = requests.map(request => {
      const student = users.find((user: User) => user.id === request.student_id);
      return {
        ...request,
        student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
        estimatedTime: Math.floor(Math.random() * 20) + 5
      };
    });

    return requestsWithDetails;
  } catch (error) {
    console.error('Error in getAvailableRideRequests:', error);
    throw error;
  }
};

// Function to get driver's ride requests
export const getDriverRideRequests = async (driver_id: string): Promise<RideRequestWithDetails[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('driver_id', driver_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching driver ride requests:', error);
      throw new Error(error.message);
    }

    // Get all students to add names to requests
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error(usersError.message);
    }

    // Add student names to requests
    const requestsWithDetails = requests.map(request => {
      const student = users.find((user: User) => user.id === request.student_id);
      return {
        ...request,
        student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
        estimatedTime: Math.floor(Math.random() * 20) + 5
      };
    });

    return requestsWithDetails;
  } catch (error) {
    console.error('Error in getDriverRideRequests:', error);
    throw error;
  }
};

// Function to update ride request status
export const updateRideRequestStatus = async (
  request_id: string, 
  driver_id: string | null, 
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
): Promise<RideRequest> => {
  try {
    const updateData: Partial<RideRequest> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Only include driver_id if it's provided and the status is 'accepted'
    if (driver_id && status === 'accepted') {
      updateData.driver_id = driver_id;
    }

    const { data, error } = await supabase
      .from('ride_requests')
      .update(updateData)
      .eq('id', request_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ride request:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error in updateRideRequestStatus:', error);
    throw error;
  }
};

// Function to get all ride requests (for admin)
export const getAllRideRequests = async (): Promise<RideRequestWithDetails[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('ride_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all ride requests:', error);
      throw new Error(error.message);
    }

    // Get all users to add names to requests
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error(usersError.message);
    }

    // Add student and driver names to requests
    const requestsWithDetails = requests.map(request => {
      const student = users.find((user: User) => user.id === request.student_id);
      const driver = request.driver_id 
        ? users.find((user: User) => user.id === request.driver_id)
        : null;

      return {
        ...request,
        student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
        driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'No Driver Assigned',
        estimatedTime: Math.floor(Math.random() * 20) + 5
      };
    });

    return requestsWithDetails;
  } catch (error) {
    console.error('Error in getAllRideRequests:', error);
    throw error;
  }
};

// Function to get pending rides for drivers
export const getPendingRides = async (): Promise<RideRequestWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*, users!student_id(first_name, last_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending rides:', error);
      throw new Error(error.message);
    }

    return data.map(ride => ({
      ...ride,
      student_name: `${ride.users.first_name} ${ride.users.last_name}`,
      estimatedTime: Math.floor(Math.random() * 20) + 5
    }));
  } catch (error) {
    console.error('Error in getPendingRides:', error);
    throw error;
  }
};

// Function to get ride statistics for a driver
export const getRideStats = async (driverId: string): Promise<{
  totalRides: number;
  completedRides: number;
  rejectedRides: number;
  acceptanceRate: number;
  averageRating: number;
}> => {
  try {
    const { data: rides, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('driver_id', driverId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    const totalRides = rides.length;
    const completedRides = rides.filter(ride => ride.status === 'completed').length;
    const rejectedRides = rides.filter(ride => ride.status === 'rejected').length;
    const acceptanceRate = totalRides > 0 ? (completedRides / totalRides) * 100 : 0;
    
    return {
      totalRides,
      completedRides,
      rejectedRides,
      acceptanceRate,
      averageRating: 4.5 // Placeholder value, would be calculated from actual ratings
    };
  } catch (error) {
    console.error('Error getting ride stats:', error);
    return {
      totalRides: 0,
      completedRides: 0,
      rejectedRides: 0,
      acceptanceRate: 0,
      averageRating: 0
    };
  }
};

// Function to accept a ride
export const acceptRide = async (rideId: string, driverId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ride_requests')
      .update({
        driver_id: driverId,
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .eq('status', 'pending');

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('Error accepting ride:', error);
    return false;
  }
};

// Function to reject a ride
export const rejectRide = async (rideId: string, driverId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ride_requests')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .eq('status', 'pending');

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('Error rejecting ride:', error);
    return false;
  }
};

// Create a consolidated export object for the rideService
export const rideService = {
  createRideRequest,
  getStudentRideRequests,
  getAvailableRideRequests,
  getDriverRideRequests,
  updateRideRequestStatus,
  getAllRideRequests,
  getPendingRides,
  getRideStats,
  acceptRide,
  rejectRide
};
