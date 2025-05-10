
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, HelperStatusLog } from "@/types";

interface AssistantStatusHistoryProps {
  assistantId?: string;
}

const AssistantStatusHistory = ({ assistantId }: AssistantStatusHistoryProps) => {
  const [assistants, setAssistants] = useState<User[]>([]);
  const [statusLogs, setStatusLogs] = useState<HelperStatusLog[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(assistantId || null);
  const [newStatus, setNewStatus] = useState<"active" | "completed" | "inactive">("active");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Load assistants
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const helperUsers = users.filter((user: User) => user.role === "helper");
    setAssistants(helperUsers);

    // Load status logs
    const logs = JSON.parse(localStorage.getItem("assistantStatusLogs") || "[]");
    setStatusLogs(logs);
  }, []);

  useEffect(() => {
    if (assistantId) {
      setSelectedAssistant(assistantId);
    }
  }, [assistantId]);

  const handleStatusChange = () => {
    if (!selectedAssistant) {
      toast({
        title: "Error",
        description: "Please select an assistant",
        variant: "destructive",
      });
      return;
    }

    // Get current assistant details
    const assistant = assistants.find(a => a.id === selectedAssistant);
    if (!assistant) return;

    const previousStatus = assistant.status || "active";

    // Update assistant status
    const updatedUsers = JSON.parse(localStorage.getItem("users") || "[]").map((user: User) => 
      user.id === selectedAssistant ? { ...user, status: newStatus } : user
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Add to status logs
    const newLog: HelperStatusLog = {
      id: Date.now().toString(),
      helper_id: selectedAssistant,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: "admin", // Should be replaced with actual admin ID
      changed_at: new Date().toISOString(),
      notes: notes,
    };

    const updatedLogs = [...statusLogs, newLog];
    localStorage.setItem("assistantStatusLogs", JSON.stringify(updatedLogs));
    setStatusLogs(updatedLogs);

    // Update local state
    setAssistants(updatedUsers.filter((user: User) => user.role === "helper"));
    setNotes("");

    toast({
      title: "Success",
      description: `${assistant.first_name} ${assistant.last_name}'s status updated to ${newStatus}`,
    });
  };

  const getFilteredLogs = () => {
    if (!selectedAssistant) return [];
    return statusLogs.filter(log => log.helper_id === selectedAssistant);
  };

  const getAssistantName = (id: string) => {
    const assistant = assistants.find(a => a.id === id);
    return assistant ? `${assistant.first_name} ${assistant.last_name}` : id;
  };

  const getSelectedAssistantStatus = () => {
    if (!selectedAssistant) return "active";
    const assistant = assistants.find(a => a.id === selectedAssistant);
    return assistant?.status || "active";
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assistant Status Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Assistant</label>
              <Select value={selectedAssistant || ""} onValueChange={setSelectedAssistant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an assistant" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.first_name} {assistant.last_name} - {assistant.status || "active"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Change Status</label>
              <Select value={newStatus} onValueChange={(value: "active" | "completed" | "inactive") => setNewStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for status change"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleStatusChange}
              disabled={!selectedAssistant || getSelectedAssistantStatus() === newStatus}
            >
              Update Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedAssistant && (
        <Card>
          <CardHeader>
            <CardTitle>Status History - {getAssistantName(selectedAssistant)}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Previous Status</TableHead>
                    <TableHead>New Status</TableHead>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.changed_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          log.previous_status === "active" ? "bg-green-100 text-green-800" : 
                          log.previous_status === "completed" ? "bg-blue-100 text-blue-800" : 
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {log.previous_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          log.new_status === "active" ? "bg-green-100 text-green-800" : 
                          log.new_status === "completed" ? "bg-blue-100 text-blue-800" : 
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {log.new_status}
                        </span>
                      </TableCell>
                      <TableCell>Admin</TableCell>
                      <TableCell>{log.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-4">No status history found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AssistantStatusHistory;
