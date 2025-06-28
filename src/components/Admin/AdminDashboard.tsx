import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertTriangle, Car, CheckSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RecentActivity from './RecentActivity';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a4de6c", "#d0ed57", "#8dd1e1", "#d88884"];

const AdminDashboard = () => {
  const { stats, loading, error } = useDashboardStats();

  // --- Complaints by Category ---
  const [complaintsByCategory, setComplaintsByCategory] = useState<any[]>([]);
  // --- User Growth Over Time ---
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  // --- Helpers/Drivers Performance ---
  const [helpersPerformance, setHelpersPerformance] = useState<any[]>([]);
  const [driversPerformance, setDriversPerformance] = useState<any[]>([]);
  const [complaintStatusCounts, setComplaintStatusCounts] = useState({ pending: 0, in_progress: 0, resolved: 0 });
  const [helpConfirmationStatusCounts, setHelpConfirmationStatusCounts] = useState({ pending: 0, confirmed: 0, rejected: 0 });

  useEffect(() => {
    // Complaints by Category
    const fetchComplaintsByCategory = async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('title');
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((c: any) => {
          counts[c.title] = (counts[c.title] || 0) + 1;
        });
        setComplaintsByCategory(Object.entries(counts).map(([name, value]) => ({ name, value })));
      }
    };
    // User Growth Over Time
    const fetchUserGrowth = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('created_at');
      if (!error && data) {
        // Group by date (YYYY-MM-DD)
        const counts: Record<string, number> = {};
        data.forEach((u: any) => {
          const date = u.created_at?.split('T')[0];
          if (date) counts[date] = (counts[date] || 0) + 1;
        });
        // Sort by date
        const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
        // Cumulative sum for growth
        let total = 0;
        const growth = sorted.map(([date, value]) => {
          total += value;
          return { date, total };
        });
        setUserGrowth(growth);
      }
    };
    // Helpers Performance
    const fetchHelpersPerformance = async () => {
      // Count help confirmations per helper
      const { data, error } = await supabase
        .from('student_help_confirmations')
        .select('helper_id');
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((c: any) => {
          counts[c.helper_id] = (counts[c.helper_id] || 0) + 1;
        });
        // Get helper names
        const helperIds = Object.keys(counts);
        if (helperIds.length > 0) {
          const { data: helpers } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', helperIds);
          setHelpersPerformance(
            helperIds.map(id => ({
              name: helpers?.find((h: any) => h.id === id) ? `${helpers.find((h: any) => h.id === id).first_name} ${helpers.find((h: any) => h.id === id).last_name}` : id,
              value: counts[id]
            }))
          );
        }
      }
    };
    // Drivers Performance
    const fetchDriversPerformance = async () => {
      // Count completed rides per driver
      const { data, error } = await supabase
        .from('ride_requests')
        .select('driver_id, status');
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((r: any) => {
          if (r.status === 'completed' && r.driver_id) {
            counts[r.driver_id] = (counts[r.driver_id] || 0) + 1;
          }
        });
        // Get driver names
        const driverIds = Object.keys(counts);
        if (driverIds.length > 0) {
          const { data: drivers } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', driverIds);
          setDriversPerformance(
            driverIds.map(id => ({
              name: drivers?.find((d: any) => d.id === id) ? `${drivers.find((d: any) => d.id === id).first_name} ${drivers.find((d: any) => d.id === id).last_name}` : id,
              value: counts[id]
            }))
          );
        }
      }
    };
    // Fetch complaint status counts for the card
    const fetchComplaintStatusCounts = async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('status');
      if (!error && data) {
        const counts = { pending: 0, in_progress: 0, resolved: 0 };
        data.forEach((c: any) => {
          if (c.status === 'pending') counts.pending++;
          else if (c.status === 'in_progress') counts.in_progress++;
          else if (c.status === 'resolved') counts.resolved++;
        });
        setComplaintStatusCounts(counts);
      }
    };
    // Fetch help confirmation status counts for the card
    const fetchHelpConfirmationStatusCounts = async () => {
      const { data, error } = await supabase
        .from('student_help_confirmations')
        .select('status');
      if (!error && data) {
        const counts = { pending: 0, confirmed: 0, rejected: 0 };
        data.forEach((c: any) => {
          if (c.status === 'pending') counts.pending++;
          else if (c.status === 'confirmed') counts.confirmed++;
          else if (c.status === 'rejected') counts.rejected++;
        });
        setHelpConfirmationStatusCounts(counts);
      }
    };
    fetchComplaintsByCategory();
    fetchUserGrowth();
    fetchHelpersPerformance();
    fetchDriversPerformance();
    fetchComplaintStatusCounts();
    fetchHelpConfirmationStatusCounts();
  }, []);

  const formatUserBreakdown = (breakdown: Record<string, number>) => {
    return Object.entries(breakdown)
      .map(([role, count]) => `${count} ${role}${count > 1 ? 's' : ''}`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 rounded w-1/4 animate-pulse mb-1" />
              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load dashboard data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? formatUserBreakdown(stats.userBreakdown) : '...'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalComplaints}</div>
            <p className="text-xs text-muted-foreground">
              {complaintStatusCounts.pending} pending, {complaintStatusCounts.in_progress} in progress, {complaintStatusCounts.resolved} resolved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ride Requests</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRideRequests}</div>
            <p className="text-xs text-muted-foreground">
              0 pending, 0 completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Help Confirmations</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHelpConfirmations}</div>
            <p className="text-xs text-muted-foreground">
              {helpConfirmationStatusCounts.pending} pending, {helpConfirmationStatusCounts.confirmed} completed
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Charts & Statistics Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Remove User Role Distribution Pie Chart */}
        {/* Complaints by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={complaintsByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#ff8042"
                  label
                >
                  {complaintsByCategory.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* User Growth Over Time Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Helpers Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Helpers Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={helpersPerformance} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d">
                  {helpersPerformance.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Drivers Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Drivers Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={driversPerformance} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#ffc658">
                  {driversPerformance.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard; 