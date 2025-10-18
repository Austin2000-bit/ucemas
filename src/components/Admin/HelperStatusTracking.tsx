import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, HelperStatusLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { SystemLogs } from "@/utils/systemLogs";
<<<<<<< HEAD
import { CheckCircle, XCircle, PauseCircle, Filter, UserCheck, Download } from "lucide-react";
=======
import { 
  CheckCircle, 
  XCircle, 
  PauseCircle, 
  ClockIcon, 
  Filter,
  UserCheck,
  Download
} from "lucide-react";
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface HelperStatus {
  id: string;
  helper_id: string;
<<<<<<< HEAD
  status: "active" | "inactive";
=======
  status: 'available' | 'busy' | 'offline';
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
  notes?: string;
  created_at: string;
  updated_at: string;
}

<<<<<<< HEAD
const allowedStatuses = ["active", "inactive"] as const;
type AllowedStatus = typeof allowedStatuses[number];

=======
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
const HelperStatusTracking = () => {
  const [helpers, setHelpers] = useState<User[]>([]);
  const [helperStatuses, setHelperStatuses] = useState<HelperStatus[]>([]);
  const [statusLogs, setStatusLogs] = useState<HelperStatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHelper, setSelectedHelper] = useState<string | null>(null);
<<<<<<< HEAD
  const [newStatus, setNewStatus] = useState<AllowedStatus>("active");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
=======
  const [newStatus, setNewStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
<<<<<<< HEAD
        const { data: helpersDataRaw, error: helpersError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email, role, created_at, updated_at")
          .eq("role", "helper")
          .order("first_name", { ascending: true });

        if (helpersError) throw helpersError;
        setHelpers((helpersDataRaw || []) as User[]);

        const { data: statusesDataRaw, error: statusesError } = await supabase
          .from("helper_statuses")
          .select("*")
          .order("updated_at", { ascending: false });

        if (statusesError) throw statusesError;
        setHelperStatuses((statusesDataRaw || []) as HelperStatus[]);

        const { data: logsDataRaw, error: logsError } = await supabase
          .from("helper_status_logs")
          .select("*")
          .order("changed_at", { ascending: false });

        if (logsError) {
          if (logsError.code === "42P01") setStatusLogs([]);
          else throw logsError;
        } else setStatusLogs((logsDataRaw || []) as HelperStatusLog[]);
      } catch (error) {
        console.error("Error fetching data:", error);
=======
        // Fetch all helpers
        const { data: helpersData, error: helpersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role')
          .eq('role', 'helper')
          .order('first_name', { ascending: true });
          
        if (helpersError) throw helpersError;
        
        setHelpers(helpersData || []);
        
        // Fetch helper statuses
        const { data: statusesData, error: statusesError } = await supabase
          .from('helper_statuses')
          .select('*')
          .order('updated_at', { ascending: false });

        if (statusesError) throw statusesError;
        setHelperStatuses(statusesData || []);
        
        // Fetch status logs
          const { data: logsData, error: logsError } = await supabase
            .from('helper_status_logs')
            .select('*')
            .order('changed_at', { ascending: false });
            
          if (logsError) {
            if (logsError.code === '42P01') {
              setStatusLogs([]);
          } else {
            throw logsError;
          }
        } else {
          setStatusLogs(logsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
        toast({
          title: "Error",
          description: "Failed to load helper data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
<<<<<<< HEAD
    fetchData();
  }, []);

=======
    
    fetchData();
  }, []);
  
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
  const updateHelperStatus = async () => {
    if (!selectedHelper || !newStatus) {
      toast({
        title: "Missing Information",
        description: "Please select a helper and status.",
        variant: "destructive",
      });
      return;
    }
<<<<<<< HEAD

    try {
      const { data: existingStatus } = await supabase
        .from("helper_statuses")
        .select("id")
        .eq("helper_id", selectedHelper)
        .single();

      if (existingStatus) {
        const { error: updateError } = await supabase
          .from("helper_statuses")
          .update({ status: newStatus, notes, updated_at: new Date().toISOString() })
          .eq("id", existingStatus.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("helper_statuses")
          .insert({
            helper_id: selectedHelper,
            status: newStatus,
            notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
      }

      await supabase.from("helper_status_logs").delete().eq("helper_id", selectedHelper);

      const { error: logError } = await supabase
        .from("helper_status_logs")
        .insert({
          helper_id: selectedHelper,
          status: newStatus,
          notes,
          changed_at: new Date().toISOString(),
          changed_by: "admin",
        });
      if (logError && logError.code !== "42P01") throw logError;

      const { data: newStatuses, error: fetchError } = await supabase
        .from("helper_statuses")
        .select("*")
        .order("updated_at", { ascending: false });
      if (fetchError) throw fetchError;
      setHelperStatuses((newStatuses || []) as HelperStatus[]);

      setNotes("");
      SystemLogs.addLog("Helper Status Update", `Helper ${selectedHelper} status updated to ${newStatus}`, "admin", "admin");

      toast({ title: "Status Updated", description: "Helper status has been updated successfully." });
    } catch (error) {
      console.error("Error updating status:", error);
=======
    
    try {
      // Update or insert helper status
      const { data: existingStatus } = await supabase
        .from('helper_statuses')
        .select('id')
        .eq('helper_id', selectedHelper)
        .single();

      if (existingStatus) {
        // Update existing status
      const { error: updateError } = await supabase
          .from('helper_statuses')
        .update({ 
          status: newStatus,
            notes: notes,
          updated_at: new Date().toISOString()
        })
          .eq('id', existingStatus.id);
        
      if (updateError) throw updateError;
      } else {
        // Insert new status
        const { error: insertError } = await supabase
          .from('helper_statuses')
          .insert({
            helper_id: selectedHelper,
            status: newStatus,
            notes: notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }
      
      // Create status log
      const { error: logError } = await supabase
        .from('helper_status_logs')
        .insert({
        helper_id: selectedHelper,
        status: newStatus,
        notes: notes,
        changed_at: new Date().toISOString(),
        changed_by: "admin"
        });
        
      if (logError && logError.code !== '42P01') throw logError;
      
      // Refresh data
      const { data: newStatuses, error: fetchError } = await supabase
        .from('helper_statuses')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      setHelperStatuses(newStatuses || []);
      
      // Clear form
      setNotes("");
      
      // Log the action
      SystemLogs.addLog(
        "Helper Status Update",
        `Helper ${selectedHelper} status updated to ${newStatus}`,
        "admin",
        "admin"
      );
      
      toast({
        title: "Status Updated",
        description: "Helper status has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating status:', error);
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
      toast({
        title: "Error",
        description: "Failed to update helper status. Please try again.",
        variant: "destructive",
      });
    }
  };
<<<<<<< HEAD

  const getStatusBadge = (status: AllowedStatus | string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" /> Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="destructive">
            <PauseCircle className="h-3 w-3 mr-1" /> Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <XCircle className="h-3 w-3 mr-1" /> Unknown
          </Badge>
        );
    }
  };

  const filteredLogs =
    filter === "all" ? statusLogs : statusLogs.filter((log) => log.status === filter);

  const downloadStatusReport = () => {
    const selectedLogs = filteredLogs;
=======
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Available</Badge>;
      case 'busy':
        return <Badge variant="secondary"><ClockIcon className="h-3 w-3 mr-1" /> Busy</Badge>;
      case 'offline':
        return <Badge variant="destructive"><PauseCircle className="h-3 w-3 mr-1" /> Offline</Badge>;
      default:
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Unknown</Badge>;
    }
  };

  const downloadStatusReport = () => {
    const selectedLogs = filter === 'all' 
      ? statusLogs 
      : statusLogs.filter(log => log.status === filter);
    
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    const helperMap = helpers.reduce((map, helper) => {
      map[helper.id] = `${helper.first_name} ${helper.last_name}`;
      return map;
    }, {} as Record<string, string>);
<<<<<<< HEAD

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Helper,Status,Changed Date,Notes\n" +
      selectedLogs
        .map((log) => {
          const helperName = helperMap[log.helper_id] || log.helper_id;
          return `"${helperName}","${log.status}","${format(
            new Date(log.changed_at),
            "yyyy-MM-dd HH:mm"
          )}","${log.notes || ""}"`;
        })
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute(
      "href",
      encodedUri
    );
    link.setAttribute(
      "download",
      `helper_status_report_${new Date().toISOString().split("T")[0]}.csv`
    );
=======
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Helper,Status,Changed Date,Notes\n"
      + selectedLogs.map(log => {
          const helperName = helperMap[log.helper_id] || log.helper_id;
          return `"${helperName}","${log.status}","${format(new Date(log.changed_at), 'yyyy-MM-dd HH:mm')}","${log.notes || ''}"`
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `helper_status_report_${new Date().toISOString().split('T')[0]}.csv`);
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
<<<<<<< HEAD
=======
  
  const filteredLogs = filter === 'all' 
    ? statusLogs 
    : statusLogs.filter(log => log.status === filter);
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
<<<<<<< HEAD
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Assistants Status Management
            </div>
            <Button variant="outline" size="sm" onClick={downloadStatusReport} className="flex items-center">
              <Download className="h-4 w-4 mr-2" /> Download Report
=======
          <CardTitle className="flex justify-between">
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Helper Status Management
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadStatusReport}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
<<<<<<< HEAD
              <label className="text-sm font-medium mb-1 block">Assistant</label>
              <Select value={selectedHelper || ""} onValueChange={setSelectedHelper}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assistant" />
                </SelectTrigger>
                <SelectContent>
                  {helpers.map((helper) => {
                    const helperStatus = helperStatuses.find((s) => s.helper_id === helper.id)?.status as
                      | AllowedStatus
                      | undefined;
                    return (
                      <SelectItem key={helper.id} value={helper.id}>
                        {helper.first_name} {helper.last_name} {helperStatus ? `(${helperStatus})` : ""}
                      </SelectItem>
                    );
                  })}
=======
              <label className="text-sm font-medium mb-1 block">Helper</label>
              <Select value={selectedHelper || ''} onValueChange={setSelectedHelper}>
                <SelectTrigger>
                  <SelectValue placeholder="Select helper" />
                </SelectTrigger>
                <SelectContent>
                  {helpers.map((helper) => (
                    <SelectItem key={helper.id} value={helper.id}>
                      {helper.first_name} {helper.last_name} {helperStatuses.find(s => s.helper_id === helper.id)?.status && `(${helperStatuses.find(s => s.helper_id === helper.id)?.status})`}
                    </SelectItem>
                  ))}
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">New Status</label>
<<<<<<< HEAD
              <Select value={newStatus} onValueChange={(value: AllowedStatus) => setNewStatus(value)}>
=======
              <Select value={newStatus} onValueChange={(value: 'available' | 'busy' | 'offline') => setNewStatus(value)}>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
<<<<<<< HEAD
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
=======
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
<<<<<<< HEAD
              <Input placeholder="Add optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
=======
              <Input
                placeholder="Add optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={updateHelperStatus}>Update Status</Button>
          </div>
        </CardContent>
      </Card>
<<<<<<< HEAD

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Assistant Status History</span>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={(value: "all" | "active" | "inactive") => setFilter(value)}>
=======
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Status History</span>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={(value: 'all' | 'available' | 'busy' | 'offline') => setFilter(value)}>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
<<<<<<< HEAD
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
=======
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading status history...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
<<<<<<< HEAD
                    <TableHead>Assistant</TableHead>
=======
                    <TableHead>Helper</TableHead>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                    <TableHead>Status</TableHead>
                    <TableHead>Changed Date</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, index) => {
<<<<<<< HEAD
                      const helper = helpers.find((h) => h.id === log.helper_id);
                      return (
                        <TableRow key={index}>
                          <TableCell>{helper ? `${helper.first_name} ${helper.last_name}` : log.helper_id}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>{format(new Date(log.changed_at), "yyyy-MM-dd HH:mm")}</TableCell>
                          <TableCell>{log.changed_by || "System"}</TableCell>
                          <TableCell className="max-w-xs truncate">{log.notes || "-"}</TableCell>
=======
                      const helper = helpers.find(h => h.id === log.helper_id);
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {helper ? `${helper.first_name} ${helper.last_name}` : log.helper_id}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log.status)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(log.changed_at), 'yyyy-MM-dd HH:mm')}
                          </TableCell>
                          <TableCell>
                            {log.changed_by || 'System'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.notes || '-'}
                          </TableCell>
>>>>>>> 025a36dbea7ac5ef0c5b9029702ea9a58bb18136
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No status history found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HelperStatusTracking;
