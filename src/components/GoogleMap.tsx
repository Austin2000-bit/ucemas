
import { useEffect, useRef, useState, memo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapProps {
  pickupLocation: string;
  destination: string;
  onRouteCalculated?: (duration: string, distance: string) => void;
}

// Using memo to prevent unnecessary renders
const GoogleMap = memo(({ pickupLocation, destination, onRouteCalculated }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map only once
  useEffect(() => {
    const initMap = async () => {
      try {
        // Use cached loader if possible
        if (!window.google) {
          const loader = new Loader({
            apiKey: 'AIzaSyBP3AWvc5kUTn8VwRLjQxxLUt3yj8izYT0',
            version: 'weekly',
            libraries: ['places']
          });
          await loader.load();
        }

        if (mapRef.current && !map) {
          const initialMap = new window.google.maps.Map(mapRef.current, {
            center: { lat: -6.3690, lng: 34.8888 },
            zoom: 6,
            // Simplify styles to improve performance
            styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
            // Disable some features to improve performance
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          const directionsServiceInstance = new window.google.maps.DirectionsService();
          const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
            map: initialMap,
            suppressMarkers: true
          });

          setMap(initialMap);
          setDirectionsService(directionsServiceInstance);
          setDirectionsRenderer(directionsRendererInstance);
        }
      } catch (err) {
        setError('Failed to load Google Maps');
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
    
    // Cleanup function to improve performance
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, []);

  // Calculate route only when both locations are available and map is loaded
  useEffect(() => {
    if (directionsService && directionsRenderer && map && pickupLocation && destination) {
      const request = {
        origin: pickupLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          
          // Calculate and format duration and distance
          const duration = result.routes[0].legs[0].duration?.text || '5-7 mins';
          const distance = result.routes[0].legs[0].distance?.text || '1-2 km';
          onRouteCalculated?.(duration, distance);
        } else {
          // Fall back to default values if route calculation fails
          onRouteCalculated?.('5-10 mins', '1-3 km');
          setError('Could not calculate route');
        }
      });
    }
  }, [pickupLocation, destination, directionsService, directionsRenderer, map, onRouteCalculated]);

  if (isLoading) {
    return (
      <div className="w-full h-[300px] rounded-lg bg-gray-100 flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[300px] rounded-lg bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[300px] rounded-lg shadow-sm bg-gray-100"
    />
  );
});

GoogleMap.displayName = "GoogleMap";

export default GoogleMap;
