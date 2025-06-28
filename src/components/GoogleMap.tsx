import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

// Add type definitions for Google Maps API
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapProps {
  pickupLocation: string;
  destination: string;
  onRouteCalculated: (time: string, distance: string) => void;
  onLocationSelected: (location: { lat: number; lng: number; address: string }) => void;
  showGeofence?: boolean;
  geofenceRadius?: number;
}

interface NearbyRide {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  driverName: string;
  vehicleType: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  pickupLocation,
  destination,
  onRouteCalculated,
  onLocationSelected,
  showGeofence = false,
  geofenceRadius = 5000
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLng | null>(null);
  const [nearbyRides, setNearbyRides] = useState<NearbyRide[]>([]);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [nearbyMarkers, setNearbyMarkers] = useState<any[]>([]);
  const [geofenceCircle, setGeofenceCircle] = useState<google.maps.Circle | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);

  // Check location permission status
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state);
        
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    };
    
    checkPermission();
  }, []);

  // Memoize the location update function
  const updateLocation = useCallback((latLng: google.maps.LatLng, initialMap: google.maps.Map) => {
    if (!initialMap) return;

    // Update map center smoothly
    initialMap.panTo(latLng);

    // Create or update geofence circle
    if (showGeofence) {
      if (geofenceCircle) {
        geofenceCircle.setCenter(latLng);
      } else {
        const circle = new google.maps.Circle({
          strokeColor: '#4285F4',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#4285F4',
          fillOpacity: 0.1,
          map: initialMap,
          center: latLng,
          radius: geofenceRadius,
        });
        setGeofenceCircle(circle);
      }
    }

    // Add or update user marker
    const marker = new google.maps.Marker({
      position: latLng,
      map: initialMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    // Get address for the location
    if (geocoder) {
      geocoder.geocode({ location: latLng }, (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          const address = results[0].formatted_address;
          onLocationSelected?.({ 
            lat: latLng.lat(), 
            lng: latLng.lng(), 
            address 
          });
        }
      });
    }
  }, [showGeofence, geofenceRadius, geocoder, onLocationSelected, geofenceCircle]);

  const requestLocation = useCallback(() => {
    if (!map) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLatLng = new google.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        );
        setUserLocation(userLatLng);
        updateLocation(userLatLng, map);
        setError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location services in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "Please try again later.";
        }
        setError(errorMessage);
      },
      options
    );
  }, [map, updateLocation]);

  // Initialize map and services
  useEffect(() => {
    let isMounted = true;
    let watchId: number | null = null;

    const initMap = async () => {
      try {
        if (!mapRef.current || isMapInitialized) {
          return;
        }

        console.log("Initializing Google Maps...");
        
        // Initialize the Google Maps loader
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY',
          version: 'weekly',
          libraries: ['places', 'geocoding']
        });

        // Load the Google Maps API
        await loader.load();
        if (!isMounted) return;
        
        console.log("Google Maps API loaded successfully");

        const initialMap = new google.maps.Map(mapRef.current, {
          center: { lat: -6.3690, lng: 34.8888 }, // Default to Tanzania coordinates
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const directionsServiceInstance = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
            map: initialMap,
            suppressMarkers: true
          });

        const geocoderInstance = new google.maps.Geocoder();

        if (!isMounted) return;

          setMap(initialMap);
          setDirectionsService(directionsServiceInstance);
          setDirectionsRenderer(directionsRendererInstance);
        setGeocoder(geocoderInstance);
        setIsMapInitialized(true);

        console.log("Google Maps initialized successfully");

        // Start watching position if permission is granted
        if (navigator.geolocation && locationPermission === 'granted') {
          const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          };

          watchId = navigator.geolocation.watchPosition(
            (position) => {
              if (!isMounted) return;
              
              const userLatLng = new google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude
              );
              setUserLocation(userLatLng);
              updateLocation(userLatLng, initialMap);
            },
            (error) => {
              if (!isMounted) return;
              console.error("Error watching location:", error);
            },
            options
          );
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error initializing map:", error);
        setError("Failed to initialize map. Please refresh the page.");
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isMapInitialized, updateLocation, locationPermission]);

  // Update nearby ride markers when rides change
  useEffect(() => {
    if (map && nearbyRides.length > 0) {
      // Clear existing markers
      nearbyMarkers.forEach(marker => marker.setMap(null));
      
      // Create new markers for nearby rides
      const newMarkers = nearbyRides.map(ride => {
        return new google.maps.Marker({
          position: ride.location,
          map: map,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new google.maps.Size(32, 32)
          },
          title: `${ride.driverName} - ${ride.vehicleType}`
        });
      });
      
      setNearbyMarkers(newMarkers);
    }
  }, [map, nearbyRides]);

  // Calculate route when pickup and destination are provided
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !pickupLocation || !destination) {
      return;
    }

      const request = {
        origin: pickupLocation,
        destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result: any, status: any) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        const route = result.routes[0].legs[0];
        onRouteCalculated(route.duration.text, route.distance.text);
      }
    });
  }, [pickupLocation, destination, directionsService, directionsRenderer, onRouteCalculated]);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden relative">
      <div ref={mapRef} className="w-full h-full" />
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded z-10">
          {error}
        </div>
      )}
      <Button
        className="absolute bottom-4 right-4 z-10"
        onClick={requestLocation}
        variant="secondary"
      >
        <Navigation className="h-4 w-4 mr-2" />
        Use My Location
      </Button>
    </div>
  );
};

export default GoogleMap;
