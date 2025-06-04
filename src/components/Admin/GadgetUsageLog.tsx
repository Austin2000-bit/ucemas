import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { GadgetUsageLog, GadgetLoan } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";
import { AlertCircle, Clock, PlusCircle, RotateCcw, StopCircle } from "lucide-react";
import { SystemLogs } from "@/utils/systemLogs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface GadgetUsageLogProps {
  gadgetLoanId: string;
  gadgetName: string;
  studentName: string;
}

const GadgetUsageLog = ({ gadgetLoanId, gadgetName, studentName }: GadgetUsageLogProps) => {
  const [usageLogs, setUsageLogs] = useState<GadgetUsageLog[]>([]);
  const [activeSession, setActiveSession] = useState<GadgetUsageLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalUsage, setTotalUsage] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLogData, setNewLogData] = useState({
    start_time: "",
    end_time: "",
    duration: 0,
    notes: ""
  });

  useEffect(() => {
    fetchUsageLogs();
  }, [gadgetLoanId]);

  const fetchUsageLogs = async () => {
    setLoading(true);
    try {
      // Fetch usage logs
      const { data: logs, error } = await supabase
        .from('gadget_usage_logs')
        .select('*')
        .eq('gadget_loan_id', gadgetLoanId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      setUsageLogs(logs || []);
      
      // Calculate total usage time
      let total = 0;
      const activeLog = logs?.find(log => !log.end_time);
      
      if (activeLog) {
        setActiveSession(activeLog);
      } else {
        setActiveSession(null);
      }
      
      logs?.forEach(log => {
        if (log.duration) {
          total += log.duration;
        }
      });
      
      setTotalUsage(total);
    } catch (error) {
      console.error('Error fetching gadget usage logs:', error);
      toast({
        title: "Error",
        description: "Failed to load gadget usage logs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (activeSession) {
      toast({
        title: "Session In Progress",
        description: "There's already an active session for this gadget.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const now = new Date().toISOString();
      
      // Create new log entry
      const { data, error } = await supabase
        .from('gadget_usage_logs')
        .insert({
          gadget_loan_id: gadgetLoanId,
          start_time: now,
          created_at: now
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Session Started",
        description: `Usage tracking started for ${gadgetName}.`
      });
      
      // Update active session and logs
      if (data && data[0]) {
        setActiveSession(data[0]);
        setUsageLogs([data[0], ...usageLogs]);
      }
      
      SystemLogs.addLog(
        "Gadget Usage",
        `${studentName} started using ${gadgetName}`,
        "admin",
        "admin"
      );
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start tracking session.",
        variant: "destructive",
      });
    }
  };

  const endSession = async () => {
    if (!activeSession) {
      toast({
        title: "No Active Session",
        description: "There's no active session to end.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const now = new Date();
      const startTime = new Date(activeSession.start_time);
      const durationMinutes = differenceInMinutes(now, startTime);
      
      // Update log entry
      const { error } = await supabase
        .from('gadget_usage_logs')
        .update({
          end_time: now.toISOString(),
          duration: durationMinutes
        })
        .eq('id', activeSession.id);
        
      if (error) throw error;
      
      toast({
        title: "Session Ended",
        description: `Usage tracking ended for ${gadgetName}. Duration: ${durationMinutes} minutes.`
      });
      
      // Update logs and total usage
      fetchUsageLogs();
      
      SystemLogs.addLog(
        "Gadget Usage",
        `${studentName} stopped using ${gadgetName} after ${durationMinutes} minutes`,
        "admin",
        "admin"
      );
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end tracking session.",
        variant: "destructive",
      });
    }
  };

  const addManualLog = async () => {
    try {
      const startTime = new Date(newLogData.start_time);
      const endTime = new Date(newLogData.end_time);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        toast({
          title: "Invalid Dates",
          description: "Please enter valid start and end times.",
          variant: "destructive",
        });
        return;
      }
      
      if (endTime <= startTime) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time.",
          variant: "destructive",
        });
        return;
      }
      
      const durationMinutes = differenceInMinutes(endTime, startTime);
      
      // Create new log entry
      const { data, error } = await supabase
        .from('gadget_usage_logs')
        .insert({
          gadget_loan_id: gadgetLoanId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration: durationMinutes,
          notes: newLogData.notes,
          created_at: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Log Added",
        description: `Manual usage log added for ${gadgetName}.`
      });
      
      // Reset form and close dialog
      setNewLogData({
        start_time: "",
        end_time: "",
        duration: 0,
        notes: ""
      });
      
      setIsAddDialogOpen(false);
      
      // Update logs
      fetchUsageLogs();
    } catch (error) {
      console.error('Error adding manual log:', error);
      toast({
        title: "Error",
        description: "Failed to add manual log.",
        variant: "destructive",
      });
    }
  };
  
  const formatDuration = (minutes: number) => {
    if (!minutes) return "0 min";
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${remainingMinutes} min`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">
            Gadget Usage Tracking - {gadgetName}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeSession ? (
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-red-500 mr-2 animate-pulse" />
                <span className="text-sm font-medium text-red-500">
                  Session in progress
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-500">
                  No active session
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student: <span className="font-medium">{studentName}</span></p>
              <p className="text-sm text-muted-foreground">Total usage time: <span className="font-medium">{formatDuration(totalUsage)}</span></p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeSession ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
                onClick={startSession}
                disabled={!!activeSession}
              >
                <PlusCircle className="h-4 w-4" />
                Start Session
              </Button>
              <Button
                variant={activeSession ? "destructive" : "outline"}
                size="sm"
                className="flex items-center gap-2"
                onClick={endSession}
                disabled={!activeSession}
              >
                <StopCircle className="h-4 w-4" />
                End Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <RotateCcw className="h-4 w-4" />
                Add Manual Log
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">Loading usage logs...</div>
          ) : (
            <>
              {usageLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.start_time), 'yyyy-MM-dd HH:mm')}
                        </TableCell>
                        <TableCell>
                          {log.end_time ? format(new Date(log.end_time), 'yyyy-MM-dd HH:mm') : (
                            <span className="flex items-center text-red-500">
                              <AlertCircle className="h-3 w-3 mr-1" /> In progress
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.duration ? formatDuration(log.duration) : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No usage logs found for this gadget.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Manual Log Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Usage Log</DialogTitle>
            <DialogDescription>
              Record past gadget usage that wasn't tracked in real-time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  value={newLogData.start_time}
                  onChange={(e) => setNewLogData({
                    ...newLogData, 
                    start_time: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="datetime-local"
                  value={newLogData.end_time}
                  onChange={(e) => setNewLogData({
                    ...newLogData, 
                    end_time: e.target.value
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add details about this usage session..."
                value={newLogData.notes}
                onChange={(e) => setNewLogData({
                  ...newLogData, 
                  notes: e.target.value
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addManualLog}>
              Add Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GadgetUsageLog;
