import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useLiveDriverLocation(driverId: string, rideId: string | null) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!driverId || !rideId) return;

    // Initial fetch
    supabase
      .from("driver_locations")
      .select("latitude, longitude")
      .eq("driver_id", driverId)
      .eq("ride_id", rideId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        console.log("Fetched driver location:", data);
        if (data) setLocation({ lat: data.latitude, lng: data.longitude });
      });

    // Subscribe to realtime updates
    const channel = supabase
      .channel("driver_locations")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "driver_locations",
          filter: `driver_id=eq.${driverId},ride_id=eq.${rideId}`,
        },
        (payload) => {
          console.log("Realtime driver location update:", payload.new);
          setLocation({
            lat: payload.new.latitude,
            lng: payload.new.longitude,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, rideId]);

  return location;
} 