import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export function useSendDriverLocation(driverId: string, rideId: string | null) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("useSendDriverLocation hook called", driverId, rideId);
    if (!driverId || !rideId || !("geolocation" in navigator)) return;

    const sendLocation = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      console.log("Sending driver location:", latitude, longitude, driverId, rideId);
      supabase
        .from("driver_locations")
        .upsert([
          {
            driver_id: driverId,
            ride_id: rideId,
            latitude,
            longitude,
            updated_at: new Date().toISOString(),
          },
        ]);
    };

    // Send immediately, then every 5 seconds
    navigator.geolocation.getCurrentPosition(sendLocation);
    intervalRef.current = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(sendLocation);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [driverId, rideId]);
} 