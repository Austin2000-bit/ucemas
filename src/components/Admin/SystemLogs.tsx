import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { List, AlertTriangle } from 'lucide-react';

interface Log {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  user_id?: string;
  user_role?: string;
}

const SystemLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('system_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100); // Get the last 100 logs

        if (error) throw error;
        setLogs(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching system logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded w-full animate-pulse" />
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
          Failed to load system logs: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <List className="mr-2 h-5 w-5" />
          System Activity Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {logs.map((log) => (
            <li key={log.id} className="text-sm border-b pb-2">
              <div className="flex justify-between">
                <span className="font-semibold">{log.type}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{log.message}</p>
              {log.user_id && (
                <p className="text-xs text-muted-foreground mt-1">
                  User: {log.user_id} ({log.user_role})
                </p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default SystemLogs; 