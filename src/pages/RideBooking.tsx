import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { SystemLogs } from "@/utils/systemLogs";
import GoogleMap from "@/components/GoogleMap";
import DriverRides from "@/components/DriverRides";
import { supabase } from "@/lib/supabase";
import { RideRequest } from "@/types";
import Navbar from "@/components/Navbar";
import { v4 as uuidv4 } from "uuid";
import { MapPin, Navigation, Clock, Check, X as XIcon, RefreshCw } from "lucide-react";
import DriverInfoCard from "@/components/DriverInfoCard";
import { websocketService, RideUpdate } from "@/services/websocketService";
import { rideService } from "@/services/rideService";
import RatingComponent from "@/components/RatingComponent";

const ALLOWED_ROLES = ['client', 'assistant', 'admin'];
const GEO_FENCE_RADIUS = 5000; // 5km in meters

const RideBooking = () => {
  const { user } = useAuth();
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [distance, setDistance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(true);
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [acceptedRide, setAcceptedRide] = useState<{ rideId: string; driverId: string } | null>(null);
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [pendingRides, setPendingRides] = useState<RideRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);

  useEffect(() => {
    // Check if geolocation is supported by the browser
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    // Check for existing permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setLocationPermission(result.state);
          // Listen for permission changes
          result.onchange = () => {
            setLocationPermission(result.state);
          };
        });
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    // Subscribe to ride updates for this rider
    const handleRideUpdate = (update: RideUpdate) => {
      console.log("Rider received ride update:", update);
      if (update.type === 'ride_accepted' && update.data.client_id === user.id) {
        setAcceptedRide({ rideId: update.rideId, driverId: update.data.driver_id });
        toast({
          title: "Your ride has been accepted!",
          description: `Driver ${update.data.driverInfo?.name || ''} is on the way.`
        });
      }
    };
    websocketService.subscribeToRideUpdates(user.id, user.role === 'client' ? 'client' : 'assistant', handleRideUpdate);
    return () => {
      websocketService.unsubscribeFromRideUpdates(user.id, handleRideUpdate);
    };
  }, [user?.id, user?.role]);

  // On mount, check if the user has a ride in progress and show driver info if accepted
  useEffect(() => {
    const fetchAcceptedRide = async () => {
      if (!user?.id) return;
      const rides = await rideService.getStudentRideRequests(user.id);
      const accepted = rides.find(r => r.status === 'accepted' && r.driver_id);
      if (accepted) {
        setAcceptedRide({ rideId: accepted.id!, driverId: accepted.driver_id! });
      }
    };
    fetchAcceptedRide();
  }, [user?.id]);

  // Poll for ride status after acceptance
  useEffect(() => {
    if (!acceptedRide?.rideId) return;
    let interval: any;
    const fetchStatus = async () => {
      const ride = await rideService.getRideRequestWithDriver(acceptedRide.rideId);
      setRideStatus(ride?.status || null);
      setCurrentRide(ride);
    };
    fetchStatus();
    interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [acceptedRide?.rideId]);

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Current Location"
        });
        toast({
          title: "Location access granted",
          description: "We can now use your current location for pickup",
        });
      },
      (error) => {
        setLocationPermission('denied');
        setError("Unable to access your location. Please enable location services.");
        toast({
          variant: "destructive",
          title: "Location access denied",
          description: "Please enable location services to use your current location",
        });
      }
    );
  };

  // Handle location selection from map
  const handleLocationSelected = (location: { lat: number; lng: number; address: string }) => {
    setUserLocation(location);
    setPickupLocation(location.address);
    checkGeofence(location);
  };

  // Check if location is within geofence
  const checkGeofence = (location: { lat: number; lng: number }) => {
    if (!userLocation) return;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = userLocation.lat * Math.PI/180;
    const φ2 = location.lat * Math.PI/180;
    const Δφ = (location.lat - userLocation.lat) * Math.PI/180;
    const Δλ = (location.lng - userLocation.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    setIsWithinGeofence(distance <= GEO_FENCE_RADIUS);
  };

  const handleFindDriver = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (!isWithinGeofence) {
        throw new Error('Pickup location is outside the allowed area (5km radius)');
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Please log in to request a ride');

      // Get user profile to check role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Unable to verify user role. Please try again.');
    }

      if (!userProfile) {
        // If no profile exists, create one with client role
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: session.user.id,
            email: session.user.email,
            role: 'client',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          throw new Error('Unable to create user profile. Please try again.');
        }
      } else if (!ALLOWED_ROLES.includes(userProfile.role)) {
        throw new Error('Your role is not authorized to request rides. Please contact support if you believe this is an error.');
      }

      if (!pickupLocation || !destination) {
        setError('Please enter both pickup and destination locations');
      return;
    }

      // Create a unique ID for the ride request
      const rideId = uuidv4();
      
      // Create the ride request object
      const rideRequest = {
        id: rideId,
        client_id: session.user.id,
        pickup_location: pickupLocation,
        destination: destination,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to Supabase with authentication
      const { error: insertError } = await supabase
        .from('ride_requests')
        .insert([rideRequest])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating ride request:', insertError);
        throw new Error(insertError.message);
      }

      setRideRequest(rideRequest);
      setError(null);
      setSuccess('Ride request submitted successfully! Looking for available drivers...');
      
      // Clear form
      setPickupLocation('');
      setDestination('');
      setEstimatedTime('');
      setDistance('');

      SystemLogs.addLog(
        "Ride request created",
        `Rider requested ride from ${pickupLocation} to ${destination}`,
        session.user.id,
        userProfile.role
      );
    } catch (error) {
      console.error("Error in handleFindDriver:", error);
      setError(error instanceof Error ? error.message : 'Failed to submit ride request');
      setSuccess(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRides = async () => {
    try {
      if (!user?.id) return;
      // Fetch both pending rides (unassigned) and accepted rides assigned to this driver
      const { data: rides, error } = await supabase
        .from('ride_requests')
        .select('*')
        .or(`status.eq.pending,status.eq.accepted`)
        .or(`driver_id.is.null,driver_id.eq.${user.id}`);
      if (error) throw error;
      setPendingRides(rides || []);
    } catch (error) {
      console.error("Error loading pending rides:", error);
      toast({
        title: "Error",
        description: "Failed to load pending rides. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPendingRides();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    if (user?.role === "driver" && user?.id) {
      loadPendingRides();
      const interval = setInterval(() => {
        loadPendingRides();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.id, user?.role]);

  const handleAcceptRide = async (ride: RideRequest) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to accept rides.",
        variant: "destructive",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const driverLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const driverInfo = {
        phone: user.phone,
        email: user.email,
      };
      try {
        const success = await rideService.acceptRide(ride.id!, user.id, driverLocation, driverInfo);
        if (success) {
          setPendingRides(prev => prev.filter(r => r.id !== ride.id));
          setActiveRideId(ride.id!);
          SystemLogs.addLog(
            "Ride accepted",
            `Driver ${user.first_name} ${user.last_name} accepted ride from ${ride.pickup_location} to ${ride.destination}`,
            user.id,
            user.role
          );
          toast({
            title: "Ride accepted!",
            description: "You have accepted this ride request.",
          });
          // Start periodic location updates
          if (locationUpdateInterval.current) clearInterval(locationUpdateInterval.current);
          locationUpdateInterval.current = setInterval(async () => {
            navigator.geolocation.getCurrentPosition(async (pos) => {
              const newLocation = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              await supabase
                .from('ride_requests')
                .update({ driver_location: newLocation, updated_at: new Date().toISOString() })
                .eq('id', ride.id);
            });
          }, 30000); // 30 seconds
        } else {
          throw new Error("Failed to accept ride");
        }
      } catch (error) {
        console.error("Error accepting ride:", error);
        toast({
          title: "Error",
          description: "Failed to accept ride. Please try again.",
          variant: "destructive",
        });
      }
    }, (error) => {
      toast({
        title: "Location Error",
        description: "Could not get your location. Please enable location services and try again.",
        variant: "destructive",
      });
    });
  };

  const handleRejectRide = async (ride: RideRequest) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to reject rides.",
        variant: "destructive",
      });
      return;
    }
    try {
      const success = await rideService.rejectRide(ride.id!, user.id);
      if (success) {
        setPendingRides(prev => prev.filter(r => r.id !== ride.id));
        SystemLogs.addLog(
          "Ride rejected",
          `Driver ${user.first_name} ${user.last_name} rejected ride from ${ride.pickup_location} to ${ride.destination}`,
          user.id,
          user.role
        );
        toast({
          title: "Ride rejected",
          description: "You have rejected this ride request.",
        });
        // Clear location update interval if this was the active ride
        if (activeRideId === ride.id && locationUpdateInterval.current) {
          clearInterval(locationUpdateInterval.current);
          locationUpdateInterval.current = null;
          setActiveRideId(null);
        }
      } else {
        throw new Error("Failed to reject ride");
      }
    } catch (error) {
      console.error("Error rejecting ride:", error);
      toast({
        title: "Error",
        description: "Failed to reject ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar title="Book a Ride" />
      <div className="container mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-500 text-white p-4 text-center text-xl font-bold">
            BOOK A RIDE
          </div>
          
          <div className="p-4 space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
            {!isWithinGeofence && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">Warning: Pickup location is outside the allowed area (5km radius)</span>
              </div>
            )}

            {locationPermission === 'prompt' && (
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4">
                <p className="font-medium">Location Access</p>
                <p className="text-sm mb-2">To provide better service, we need access to your location. This helps us:</p>
                <ul className="list-disc list-inside text-sm mb-2">
                  <li>Automatically fill your pickup location</li>
                  <li>Find nearby drivers more accurately</li>
                  <li>Calculate precise ride estimates</li>
                </ul>
                <Button
                  onClick={requestLocationPermission}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Allow Location Access
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter pickup location"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
              {locationPermission === 'granted' && userLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    setPickupLocation(userLocation.address);
                    checkGeofence(userLocation);
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
              )}
              {locationPermission === 'denied' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    toast({
                      variant: "destructive",
                      title: "Location access required",
                      description: "Please enable location services in your browser settings to use this feature",
                    });
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Enable Location Services
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Enter destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                  className="pl-10"
              />
              </div>
            </div>

            <GoogleMap
              pickupLocation={pickupLocation}
              destination={destination}
              onRouteCalculated={(time, dist) => {
                setEstimatedTime(time);
                setDistance(dist);
              }}
              onLocationSelected={handleLocationSelected}
              showGeofence={true}
              geofenceRadius={GEO_FENCE_RADIUS}
            />

            {(estimatedTime || distance) && (
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

            {acceptedRide && (
              <>
                <DriverInfoCard rideId={acceptedRide.rideId} driverId={acceptedRide.driverId} />
                {rideStatus === "completed" && currentRide?.student_id === user?.id && (
                  <RatingComponent driverId={acceptedRide.driverId} rideId={acceptedRide.rideId} />
                )}
              </>
            )}

            <div className="p-4">
              <Button
                className="w-full"
                onClick={handleFindDriver}
                disabled={isLoading || !pickupLocation || !destination || !isWithinGeofence}
              >
                {isLoading ? "Submitting request..." : "Request Ride"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {user?.role === "driver" && (
        <div className="container mx-auto p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
              <div className="text-xl font-bold">AVAILABLE RIDES</div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-blue-600"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="p-4">
              {pendingRides.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending ride requests
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRides.map((ride) => (
                    <div key={ride.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-blue-500" />
                            <span className="text-sm font-medium">{ride.pickup_location}</span>
                          </div>
                        </div>
                        <div className="border-l-2 border-dashed border-gray-300 dark:border-gray-600 h-6 ml-[9px]"></div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-red-500" />
                            <span className="text-sm font-medium">{ride.destination}</span>
                          </div>
                        </div>
                        <GoogleMap
                          pickupLocation={ride.pickup_location}
                          destination={ride.destination}
                          onRouteCalculated={() => {}}
                        />
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock size={18} />
                            <span className="text-sm font-medium">Estimated time</span>
                          </div>
                          <span className="text-sm font-bold">{ride.estimatedTime || "Calculating..."}</span>
                        </div>
                        {ride.status === 'pending' ? (
                          <div className="flex gap-4">
                            <Button 
                              className="flex-1" 
                              variant="outline"
                              onClick={() => handleRejectRide(ride)}
                            >
                              <XIcon className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                            <Button 
                              className="flex-1"
                              onClick={() => handleAcceptRide(ride)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                          </div>
                        ) : ride.status === 'accepted' && ride.driver_id === user?.id ? (
                          <div className="flex gap-4">
                            <Button 
                              className="flex-1"
                              // onClick={() => handleCompleteRide(ride)} // Optionally add complete ride logic
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Complete Ride
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideBooking;
