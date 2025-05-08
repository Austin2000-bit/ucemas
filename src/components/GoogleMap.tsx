import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapProps {
  pickupLocation: string;
  destination: string;
  onRouteCalculated?: (duration: string) => void;
}

const GoogleMap = ({ pickupLocation, destination, onRouteCalculated }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
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
          const initialMap = new google.maps.Map(mapRef.current, {
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

          const directionsServiceInstance = new google.maps.DirectionsService();
          const directionsRendererInstance = new google.maps.DirectionsRenderer({
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
      const request: google.maps.DirectionsRequest = {
        origin: pickupLocation,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result, status) => {
        console.log('Route calculation status:', status);
        if (status === google.maps.DirectionsStatus.OK && result) {
          console.log('Route calculated successfully');
          directionsRenderer.setDirections(result);
          
          // Calculate and format duration
          const duration = result.routes[0].legs[0].duration?.text || '5-7';
          onRouteCalculated?.(duration);
        } else {
          console.error('Failed to calculate route:', status);
          setError('Failed to calculate route');
        }
      });
    }
  }, [pickupLocation, destination, directionsService, directionsRenderer]);

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