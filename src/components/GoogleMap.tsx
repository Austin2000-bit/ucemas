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

// Location mapping for common university locations
const LOCATION_MAPPINGS: Record<string, { lat: number; lng: number; address: string }> = {
  "University Main Gate": { lat: -6.3690, lng: 34.8888, address: "University of Dar es Salaam, Dar es Salaam, Tanzania" },
  "Engineering Building": { lat: -6.3695, lng: 34.8890, address: "Engineering Building, University of Dar es Salaam, Dar es Salaam, Tanzania" },
  "Library": { lat: -6.3685, lng: 34.8885, address: "University Library, University of Dar es Salaam, Dar es Salaam, Tanzania" },
  "Student Center": { lat: -6.3688, lng: 34.8892, address: "Student Center, University of Dar es Salaam, Dar es Salaam, Tanzania" },
  "Cafeteria": { lat: -6.3692, lng: 34.8886, address: "Cafeteria, University of Dar es Salaam, Dar es Salaam, Tanzania" },
  "Parking Lot": { lat: -6.3698, lng: 34.8884, address: "Parking Lot, University of Dar es Salaam, Dar es Salaam, Tanzania" }
};

interface GoogleMapProps {
  pickupLocation: string;
  destination: string;
  onRouteCalculated: (time: string, distance: string) => void;
  onLocationSelected: (location: { lat: number; lng: number; address: string }) => void;
  showGeofence?: boolean;
  geofenceRadius?: number;
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
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [geofenceCircle, setGeofenceCircle] = useState<google.maps.Circle | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

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
      } catch (error) {
        if (!isMounted) return;
        console.error("Error initializing map:", error);
        setError("Failed to initialize map. Please refresh the page.");
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [isMapInitialized, updateLocation]);

  // Calculate route when pickup and destination are provided
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !pickupLocation || !destination) {
      return;
    }

    const calculateRoute = async () => {
      try {
        // Helper function to geocode addresses
        const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
          if (!geocoder) return null;
          
          return new Promise((resolve) => {
            geocoder.geocode({ address }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                const location = results[0].geometry.location;
                resolve({ lat: location.lat(), lng: location.lng() });
              } else {
                console.warn(`Geocoding failed for address: ${address}`, status);
                resolve(null);
              }
            });
          });
        };

        // First, check if we have predefined coordinates for these locations
        const getLocationCoords = (locationName: string): { lat: number; lng: number } | null => {
          const mapping = LOCATION_MAPPINGS[locationName];
          if (mapping) {
            return { lat: mapping.lat, lng: mapping.lng };
          }
          return null;
        };

        // Try to get coordinates from our mapping first
        let pickupCoords = getLocationCoords(pickupLocation);
        let destCoords = getLocationCoords(destination);

        // If not found in mapping, try geocoding
        if (!pickupCoords && geocoder) {
          pickupCoords = await geocodeAddress(pickupLocation);
        }
        if (!destCoords && geocoder) {
          destCoords = await geocodeAddress(destination);
        }

        // If we still don't have coordinates, use a fallback approach
        if (!pickupCoords || !destCoords) {
          console.warn('Could not get coordinates for locations, using fallback');
          
          // Use the university as a fallback center point
          const fallbackCenter = { lat: -6.3690, lng: 34.8888 };
          
          // Create a simple route visualization without actual directions
          if (map) {
            // Clear any existing directions
            directionsRenderer.setDirections({ routes: [] });
            
            // Add markers for pickup and destination
            new google.maps.Marker({
              position: fallbackCenter,
              map: map,
              title: pickupLocation,
              label: "P"
            });
            
            new google.maps.Marker({
              position: { lat: fallbackCenter.lat + 0.001, lng: fallbackCenter.lng + 0.001 },
              map: map,
              title: destination,
              label: "D"
            });
            
            // Set a default estimated time and distance
            onRouteCalculated("5-10 min", "~1 km");
          }
          return;
        }

        // Use coordinates for accurate routing
        const request = {
          origin: pickupCoords,
          destination: destCoords,
          travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, (result: any, status: any) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
            const route = result.routes[0].legs[0];
            onRouteCalculated(route.duration.text, route.distance.text);
          } else {
            console.error('Directions request failed:', status);
            // Fallback to simple markers without route
            if (map) {
              directionsRenderer.setDirections({ routes: [] });
              
              new google.maps.Marker({
                position: pickupCoords,
                map: map,
                title: pickupLocation,
                label: "P"
              });
              
              new google.maps.Marker({
                position: destCoords,
                map: map,
                title: destination,
                label: "D"
              });
              
              onRouteCalculated("Route unavailable", "Distance unknown");
            }
          }
        });
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    calculateRoute();
  }, [pickupLocation, destination, directionsService, directionsRenderer, onRouteCalculated, geocoder]);

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
