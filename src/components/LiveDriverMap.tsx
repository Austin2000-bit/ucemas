import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export function LiveDriverMap({ driverLocation }: { driverLocation: { lat: number; lng: number } | null }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded || !driverLocation) return null;

  return (
    <GoogleMap
      center={driverLocation}
      zoom={16}
      mapContainerStyle={{ width: "100%", height: "350px" }}
    >
      <Marker position={driverLocation} label="Driver" />
    </GoogleMap>
  );
} 