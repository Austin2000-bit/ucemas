import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  Laptop, 
  Clock, 
  TrendingUp,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReportData {
  totalUsers: {
    all: number;
    students: number;
    assistants: number;
    admins: number;
  };
  totalComplaints: {
    all: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
  totalAssignments: {
    all: number;
    active: number;
  };
  totalConfirmations: {
    all: number;
    pending: number;
    confirmed: number;
  };
  monthlyTrends: {
    users: number;
    complaints: number;
    assignments: number;
    confirmations: number;
  };
  averageResponseTime: number;
}

const ReportsOverview = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    totalUsers: {
      all: 0,
      students: 0,
      assistants: 0,
      admins: 0
    },
    totalComplaints: {
      all: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0
    },
    totalAssignments: {
      all: 0,
      active: 0
    },
    totalConfirmations: {
      all: 0,
      pending: 0,
      confirmed: 0
    },
    monthlyTrends: {
      users: 0,
      complaints: 0,
      assignments: 0,
      confirmations: 0
    },
    averageResponseTime: 0
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Get current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Initialize data object
      const data: ReportData = {
        totalUsers: {
          all: 0,
          students: 0,
          assistants: 0,
          admins: 0
        },
        totalComplaints: {
          all: 0,
          pending: 0,
          inProgress: 0,
          resolved: 0
        },
        totalAssignments: {
          all: 0,
          active: 0
        },
        totalConfirmations: {
          all: 0,
          pending: 0,
          confirmed: 0
        },
        monthlyTrends: {
          users: 0,
          complaints: 0,
          assignments: 0,
          confirmations: 0
        },
        averageResponseTime: 0
      };

      // Fetch user statistics
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('role');

        if (!usersError && usersData) {
          data.totalUsers.all = usersData.length;
          data.totalUsers.students = usersData.filter(u => u.role === 'student').length;
          data.totalUsers.assistants = usersData.filter(u => u.role === 'assistant').length;
          data.totalUsers.admins = usersData.filter(u => u.role === 'admin').length;
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }

      // Fetch complaint statistics
      try {
        const { data: complaintsData, error: complaintsError } = await supabase
          .from('complaints')
          .select('status, created_at, updated_at');

        if (!complaintsError && complaintsData) {
          data.totalComplaints.all = complaintsData.length;
          data.totalComplaints.pending = complaintsData.filter(c => c.status === 'pending').length;
          data.totalComplaints.inProgress = complaintsData.filter(c => c.status === 'in_progress').length;
          data.totalComplaints.resolved = complaintsData.filter(c => c.status === 'resolved').length;

          // Calculate average response time for resolved complaints
          const resolvedComplaints = complaintsData.filter(c => c.status === 'resolved' && c.updated_at);
          if (resolvedComplaints.length > 0) {
            const totalResponseTime = resolvedComplaints.reduce((acc, complaint) => {
              const created = new Date(complaint.created_at);
              const updated = new Date(complaint.updated_at);
              return acc + (updated.getTime() - created.getTime());
            }, 0);
            data.averageResponseTime = Math.round(totalResponseTime / resolvedComplaints.length / (1000 * 60)); // Convert to minutes
          }
        }
      } catch (error) {
        console.error('Error fetching complaints:', error);
      }

      // Fetch assignment statistics
      try {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('helper_student_assignments')
          .select('status');

        if (!assignmentsError && assignmentsData) {
          data.totalAssignments.all = assignmentsData.length;
          data.totalAssignments.active = assignmentsData.filter(a => a.status === 'active').length;
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }

      // Fetch confirmation statistics
      try {
        const { data: confirmationsData, error: confirmationsError } = await supabase
          .from('student_help_confirmations')
          .select('status');

        if (!confirmationsError && confirmationsData) {
          data.totalConfirmations.all = confirmationsData.length;
          data.totalConfirmations.pending = confirmationsData.filter(c => c.status === 'pending').length;
          data.totalConfirmations.confirmed = confirmationsData.filter(c => c.status === 'confirmed').length;
        }
      } catch (error) {
        console.error('Error fetching confirmations:', error);
      }

      // Calculate monthly trends
      try {
        // Monthly users
        const { count: monthlyUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        data.monthlyTrends.users = monthlyUsers || 0;

        // Monthly complaints
        const { count: monthlyComplaints } = await supabase
          .from('complaints')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        data.monthlyTrends.complaints = monthlyComplaints || 0;

        // Monthly assignments
        const { count: monthlyAssignments } = await supabase
          .from('helper_student_assignments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        data.monthlyTrends.assignments = monthlyAssignments || 0;

        // Monthly confirmations
        const { count: monthlyConfirmations } = await supabase
          .from('student_help_confirmations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString());

        data.monthlyTrends.confirmations = monthlyConfirmations || 0;
      } catch (error) {
        console.error('Error calculating monthly trends:', error);
      }

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const reportContent = [
      ['USNMS System Report', format(new Date(), 'yyyy-MM-dd HH:mm')],
      [''],
      ['User Statistics'],
      ['Total Users:', reportData.totalUsers.all],
      ['Students:', reportData.totalUsers.students],
      ['Assistants:', reportData.totalUsers.assistants],
      ['Admins:', reportData.totalUsers.admins],
      [''],
      ['Complaint Statistics'],
      ['Total Complaints:', reportData.totalComplaints.all],
      ['Pending:', reportData.totalComplaints.pending],
      ['In Progress:', reportData.totalComplaints.inProgress],
      ['Resolved:', reportData.totalComplaints.resolved],
      ['Average Response Time (minutes):', reportData.averageResponseTime],
      [''],
      ['Assignment Statistics'],
      ['Total Assignments:', reportData.totalAssignments.all],
      ['Active Assignments:', reportData.totalAssignments.active],
      [''],
      ['Help Confirmation Statistics'],
      ['Total Confirmations:', reportData.totalConfirmations.all],
      ['Pending Confirmations:', reportData.totalConfirmations.pending],
      ['Confirmed Sessions:', reportData.totalConfirmations.confirmed],
      [''],
      ['Monthly Trends'],
      ['New Users:', reportData.monthlyTrends.users],
      ['New Complaints:', reportData.monthlyTrends.complaints],
      ['New Assignments:', reportData.monthlyTrends.assignments],
      ['New Confirmations:', reportData.monthlyTrends.confirmations]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([reportContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usnms_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reports Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center py-4">Loading report data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reports Overview</CardTitle>
          <Button onClick={downloadReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalUsers.all}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.totalUsers.students} students, {reportData.totalUsers.assistants} assistants
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Complaints</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalComplaints.all}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.totalComplaints.pending} pending, {reportData.totalComplaints.resolved} resolved
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalAssignments.all}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.totalAssignments.active} active assignments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Help Sessions</CardTitle>
                <Laptop className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalConfirmations.confirmed}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.totalConfirmations.pending} pending confirmations
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.averageResponseTime} minutes</div>
                <p className="text-xs text-muted-foreground">
                  Average time to resolve complaints
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsOverview; 