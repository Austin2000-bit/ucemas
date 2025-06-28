import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalUsers: number;
  userBreakdown: Record<string, number>;
  totalComplaints: number;
  totalRideRequests: number;
  totalHelpConfirmations: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          usersResponse,
          complaintsResponse,
          rideRequestsResponse,
          helpConfirmationsResponse
        ] = await Promise.all([
          supabase.from('users').select('role', { count: 'exact' }),
          supabase.from('complaints').select('id', { count: 'exact', head: true }),
          supabase.from('ride_requests').select('id', { count: 'exact', head: true }),
          supabase.from('student_help_confirmations').select('id', { count: 'exact', head: true }),
        ]);

        if (usersResponse.error) throw new Error(`Users: ${usersResponse.error.message}`);
        if (complaintsResponse.error) throw new Error(`Complaints: ${complaintsResponse.error.message}`);
        if (rideRequestsResponse.error) throw new Error(`Rides: ${rideRequestsResponse.error.message}`);
        if (helpConfirmationsResponse.error) throw new Error(`Confirmations: ${helpConfirmationsResponse.error.message}`);

        // Process user data for breakdown
        const userBreakdown = (usersResponse.data || []).reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setStats({
          totalUsers: usersResponse.count || 0,
          userBreakdown,
          totalComplaints: complaintsResponse.count || 0,
          totalRideRequests: rideRequestsResponse.count || 0,
          totalHelpConfirmations: helpConfirmationsResponse.count || 0,
        });

      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}; 