import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Star, Car } from "lucide-react";
import { rideService } from "@/services/rideService";
import { supabase } from "@/lib/supabase";
import { GiAutoRickshaw } from "react-icons/gi";
import { toast } from "@/hooks/use-toast";

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type?: string;
  current_location?: { lat: number; lng: number };
  rating?: number;
}

interface DriverInfoCardProps {
  rideId: string;
  driverId: string;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

const DriverInfoCard = ({ rideId, driverId, onLocationUpdate }: DriverInfoCardProps) => {
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    const loadDriverInfo = async () => {
      try {
        setLoading(true);
        const info = await rideService.getDriverInfo(driverId);
        if (info) {
          setDriverInfo(info);
        } else {
          setError("Unable to load driver information");
        }
      } catch (err) {
        setError("Failed to load driver information");
        console.error("Error loading driver info:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDriverInfo();
  }, [driverId]);

  useEffect(() => {
    const fetchRating = async () => {
      const { data, error } = await supabase
        .from('ride_ratings')
        .select('rating')
        .eq('driver_id', driverId);
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
      } else {
        setAverageRating(null);
      }
    };
    fetchRating();
  }, [driverId]);

  const handleCall = () => {
    if (driverInfo?.phone) {
      window.open(`tel:${driverInfo.phone}`, '_self');
    }
  };

  const handleEmail = () => {
    if (driverInfo?.email) {
      window.open(`mailto:${driverInfo.email}`, '_self');
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Driver Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !driverInfo) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Car className="h-5 w-5" />
            Driver Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error || "Driver information not available"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span style={{ fontSize: "1.5rem" }} role="img" aria-label="tuk-tuk">🛺</span>
          Your Driver
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Driver Name and Rating */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{driverInfo.name}</h3>
            {averageRating !== null && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">
                  {averageRating.toFixed(1)} rating
                </span>
              </div>
            )}
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {driverInfo.vehicle_type === "Bajaj" ? (
              <span style={{ fontSize: "1.25rem" }} role="img" aria-label="tuk-tuk">🛺</span>
            ) : (
              <Car className="h-3 w-3" />
            )}
            {driverInfo.vehicle_type || "Bajaj"}
          </Badge>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Phone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{driverInfo.phone}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                disabled={!driverInfo.phone}
                onClick={() => {
                  if (driverInfo.phone) {
                    navigator.clipboard.writeText(driverInfo.phone);
                    toast({ title: "Copied!", description: "Phone number copied to clipboard." });
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Email</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{driverInfo.email}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEmail}
                className="h-7 px-2"
              >
                Email
              </Button>
            </div>
          </div>
        </div>

        {/* Current Location */}
        {driverInfo.current_location && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Current Location: {driverInfo.current_location.lat.toFixed(4)}, {driverInfo.current_location.lng.toFixed(4)}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-center pt-2">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Driver is on the way
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverInfoCard; 