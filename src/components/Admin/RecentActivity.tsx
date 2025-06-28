import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { List, AlertTriangle, UserCheck, LogOut, FileWarning, Car, SquareCheck } from 'lucide-react';

// Define the structure of a log with user details
interface ActivityLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  users?: {
    first_name: string;
    last_name: string;
  } | null;
}

// Map activity types to icons for better visual feedback
const activityIcons: { [key: string]: React.ElementType } = {
  'User Login': UserCheck,
  'User Logout': LogOut,
  'Complaint submitted': FileWarning,
  'Ride Request': Car,
  'Help Confirmed': SquareCheck,
  default: List,
};

const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('system_logs')
          .select(`
            id,
            timestamp,
            type,
            message,
            users (
              first_name,
              last_name
            )
          `)
          .order('timestamp', { ascending: false })
          .limit(10); // Fetch the latest 10 activities

        if (error) throw error;
        setActivities(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching recent activity:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const renderActivityItem = (activity: ActivityLog) => {
    const Icon = activityIcons[activity.type] || activityIcons.default;
    const userName = activity.users ? `${activity.users.first_name} ${activity.users.last_name}` : 'System';
    
    return (
      <li key={activity.id} className="flex items-center space-x-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
          <Icon className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {activity.type}
            <span className="font-normal text-muted-foreground"> - {userName}</span>
          </p>
          <p className="text-xs text-muted-foreground">{activity.message}</p>
        </div>
        <time className="text-xs text-muted-foreground">
          {new Date(activity.timestamp).toLocaleTimeString()}
        </time>
      </li>
    );
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load recent activity: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <ul className="space-y-6">
            {activities.map(renderActivityItem)}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity to display.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity; 