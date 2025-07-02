import { useState, useEffect } from "react";
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
import { MapPin, Navigation } from "lucide-react";
import DriverInfoCard from "@/components/DriverInfoCard";
import { websocketService, RideUpdate } from "@/services/websocketService";
import { rideService } from "@/services/rideService";
import RatingComponent from "@/components/RatingComponent";
import { useLiveDriverLocation } from "@/hooks/useLiveDriverLocation";
import { LiveDriverMap } from "@/components/LiveDriverMap";
import { GoogleMap as GoogleMapsMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const ALLOWED_ROLES = ['student', 'admin', 'assistant'];
const GEO_FENCE_RADIUS = 5000; // 5km in meters

const RideBooking = () => {
  const { user } = useAuth();
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [distance, setDistance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [nearbyRides, setNearbyRides] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(true);
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [acceptedRide, setAcceptedRide] = useState<{ rideId: string; driverId: string } | null>(null);
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [showNearbyMap, setShowNearbyMap] = useState(false);

  console.log("Accepted ride:", acceptedRide);
  const driverLocation = useLiveDriverLocation(acceptedRide?.driverId, acceptedRide?.rideId);

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
    // Subscribe to ride updates for this student
    const handleRideUpdate = (update: RideUpdate) => {
      console.log("Student received ride update:", update);
      if (update.type === 'ride_accepted' && update.data.student_id === user.id) {
        setAcceptedRide({ rideId: update.rideId, driverId: update.data.driver_id });
        toast({
          title: "Your ride has been accepted!",
          description: `Driver ${update.data.driverInfo?.name || ''} is on the way.`
        });
      }
    };
    websocketService.subscribeToRideUpdates(user.id, 'student', handleRideUpdate);
    return () => {
      websocketService.unsubscribeFromRideUpdates(user.id, handleRideUpdate);
    };
  }, [user?.id]);

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

  useEffect(() => {
    if (!acceptedRide?.driverId) return;
    const channel = supabase
      .channel('public:users')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${acceptedRide.driverId}` }, (payload) => {
        // This is a placeholder for the LiveDriverMap component
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [acceptedRide?.driverId]);

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
        // Convert coordinates to address using reverse geocoding
        // This will be handled by the GoogleMap component
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Current Location" // This will be updated by reverse geocoding
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
      setShowNearbyMap(false);
      setSuccess('Finding nearby drivers...');
      const lat = userLocation?.lat;
      const lng = userLocation?.lng;
      if (lat && lng) {
        const drivers = await rideService.getNearbyRides(lat, lng, 5);
        console.log("Nearby drivers:", drivers);
        setNearbyDrivers(drivers);
        setShowNearbyMap(true);
        setSuccess(null);
        return;
      }
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
        // If no profile exists, create one with student role
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: session.user.id,
            email: session.user.email,
            role: 'student',
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
        student_id: session.user.id,
        pickup_location: pickupLocation,
        destination: destination,
        status: 'pending',
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
      setShowNearbyMap(false);
      setSuccess('Finding nearby drivers...');
      
      // Clear form
      setPickupLocation('');
      setDestination('');
      setEstimatedTime('');
      setDistance('');
    } catch (error) {
      console.error("Error in handleFindDriver:", error);
      setError(error instanceof Error ? error.message : 'Failed to find drivers');
      setSuccess(null);
    }
  };

  if (user?.role === "driver") {
    return <DriverRides />;
  }

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

            {driverLocation && (
              <GoogleMap
                pickupLocation={pickupLocation}
                destination={destination}
                driverLocation={driverLocation}
                onRouteCalculated={(time, dist) => {
                  setEstimatedTime(time);
                  setDistance(dist);
                }}
                onLocationSelected={handleLocationSelected}
                showGeofence={true}
                geofenceRadius={GEO_FENCE_RADIUS}
              />
            )}

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
                {(() => { console.log("rideStatus:", rideStatus, "currentRide:", currentRide, "user:", user); return null; })()}
                {rideStatus === "completed" && currentRide?.student_id === user?.id && (
                  <RatingComponent driverId={acceptedRide.driverId} rideId={acceptedRide.rideId} />
                )}
                <LiveDriverMap driverLocation={driverLocation} />
              </>
            )}

            <div className="p-4">
              <Button
                className="w-full"
                onClick={handleFindDriver}
                disabled={isLoading || !pickupLocation || !destination || !isWithinGeofence}
              >
                {isLoading ? "Finding driver..." : "Find Driver"}
              </Button>
            </div>

            {showNearbyMap && userLocation && (
              <NearbyDriversMap center={{ lat: userLocation.lat, lng: userLocation.lng }} drivers={nearbyDrivers} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function NearbyDriversMap({ center, drivers }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });
  if (!isLoaded || !center) return null;
  return (
    <GoogleMapsMap center={center} zoom={15} mapContainerStyle={{ width: "100%", height: "350px" }}>
      <Marker position={center} label="You" />
      {drivers.map((d) => (
        <Marker key={d.id} position={d.location} label={d.driver_name} />
      ))}
    </GoogleMapsMap>
  );
}

export default RideBooking;
