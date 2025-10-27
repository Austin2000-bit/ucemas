import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DriverRating } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DriverRatingWithUser extends DriverRating {
  rider_name?: string;
  driver_name?: string;
  pickup_location?: string;
  destination?: string;
}

const AdminDriverRatings = () => {
  const [ratings, setRatings] = useState<DriverRatingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'client' | 'assistant'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'driver'>('date');

  useEffect(() => {
    loadRatings();
  }, [filter, sortBy]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('driver_ratings')
        .select('*')
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      // Get rider and driver information
      const riderIds = [...new Set(ratingsData.map(r => r.rider_id))];
      const driverIds = [...new Set(ratingsData.map(r => r.driver_id))];
      const rideIds = [...new Set(ratingsData.map(r => r.ride_id))];

      // Fetch user information
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .in('id', [...riderIds, ...driverIds]);

      // Fetch ride information
      const { data: ridesData } = await supabase
        .from('ride_requests')
        .select('id, pickup_location, destination')
        .in('id', rideIds);

      // Combine data
      const ratingsWithDetails = ratingsData.map(rating => {
        const rider = usersData?.find(u => u.id === rating.rider_id);
        const driver = usersData?.find(u => u.id === rating.driver_id);
        const ride = ridesData?.find(r => r.id === rating.ride_id);

        return {
          ...rating,
          rider_name: rider ? `${rider.first_name} ${rider.last_name} (${rider.role})` : 'Unknown',
          driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown',
          pickup_location: ride?.pickup_location,
          destination: ride?.destination,
          rider_role: rider?.role
        };
      });

      // Filter by rider type
      let filtered = ratingsWithDetails;
      if (filter !== 'all') {
        filtered = ratingsWithDetails.filter(r => r.rider_role === filter);
      }

      // Sort ratings
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'rating':
            return b.rating - a.rating;
          case 'driver':
            return a.driver_name?.localeCompare(b.driver_name || '') || 0;
          default:
            return 0;
        }
      });

      setRatings(sorted);
    } catch (error) {
      console.error('Error loading driver ratings:', error);
      toast({
        title: "Error",
        description: "Failed to load driver ratings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / ratings.length).toFixed(2);
  };

  const getRatingCount = (stars: number) => {
    return ratings.filter(r => r.rating === stars).length;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading driver ratings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Driver Ratings Dashboard</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating()}</div>
            {renderStars(Math.round(parseFloat(getAverageRating())))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">5-Star Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getRatingCount(5)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">1-Star Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getRatingCount(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <div className="flex gap-4 items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All Riders</option>
          <option value="client">Clients Only</option>
          <option value="assistant">Assistants Only</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="date">Sort by Date</option>
          <option value="rating">Sort by Rating</option>
          <option value="driver">Sort by Driver</option>
        </select>
      </div>

      {/* Ratings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Driver Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No driver ratings available yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Rider</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Ride Route</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell>
                      {new Date(rating.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {rating.rider_name}
                      </Badge>
                    </TableCell>
                    <TableCell>{rating.driver_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{rating.pickup_location}</div>
                        <div className="text-muted-foreground">→ {rating.destination}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderStars(rating.rating)}
                        <span className="font-medium">{rating.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {rating.feedback || 'No feedback'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDriverRatings;
