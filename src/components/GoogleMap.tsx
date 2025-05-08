
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

// Define Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

interface GoogleMapProps {
  pickupLocation: string;
  destination: string;
  onRouteCalculated?: (duration: string) => void;
}

const GoogleMap = ({ pickupLocation, destination, onRouteCalculated }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any | null>(null);
  const [directionsService, setDirectionsService] = useState<any | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('Initializing Google Maps...');
        const loader = new Loader({
          apiKey: 'AIzaSyBP3AWvc5kUTn8VwRLjQxxLUt3yj8izYT0',
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        console.log('Google Maps loaded successfully');

        if (mapRef.current) {
          console.log('Creating map instance...');
          const initialMap = new window.google.maps.Map(mapRef.current, {
            center: { lat: -6.3690, lng: 34.8888 }, // Tanzania coordinates
            zoom: 6, // Zoom out to show more of Tanzania
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });

          const directionsServiceInstance = new window.google.maps.DirectionsService();
          const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
            map: initialMap,
            suppressMarkers: true
          });

          setMap(initialMap);
          setDirectionsService(directionsServiceInstance);
          setDirectionsRenderer(directionsRendererInstance);
          console.log('Map instance created successfully');
        } else {
          console.error('Map container ref is not available');
          setError('Map container not found');
        }
      } catch (err) {
        console.error('Error initializing Google Maps:', err);
        setError('Failed to load Google Maps');
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (directionsService && directionsRenderer && pickupLocation && destination) {
      console.log('Calculating route...', { pickupLocation, destination });
      const request: any = {
        origin: pickupLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result: any, status: any) => {
        console.log('Route calculation status:', status);
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          console.log('Route calculated successfully');
          directionsRenderer.setDirections(result);
          
          // Calculate and format duration
          const duration = result.routes[0].legs[0].duration?.text || '5-7';
          if (onRouteCalculated) {
            onRouteCalculated(duration);
          }
        } else {
          console.error('Failed to calculate route:', status);
          setError('Failed to calculate route');
        }
      });
    }
  }, [pickupLocation, destination, directionsService, directionsRenderer, onRouteCalculated]);

  if (error) {
    return (
      <div className="w-full h-[400px] rounded-lg shadow-md bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[400px] rounded-lg shadow-md bg-gray-100"
    />
  );
};

export default GoogleMap;
