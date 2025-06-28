type LogEntry = {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userId: string;
  userRole: string;
};

type ComplaintStatus = "Pending" | "In Progress" | "Resolved" | "Rejected";

type ComplaintLog = {
  id: string;
  complaintId: string;
  status: ComplaintStatus;
  timestamp: string;
  updatedBy: string;
  notes: string;
};

export const SystemLogs = {
  // Add a new log entry
  addLog: (action: string, details: string, userId: string, userRole: string) => {
    const logs = JSON.parse(localStorage.getItem("systemLogs") || "[]");
    const newLog: LogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      userId,
      userRole,
    };
    logs.push(newLog);
    localStorage.setItem("systemLogs", JSON.stringify(logs));
  },

  // Update complaint status
  updateComplaintStatus: (
    complaintId: string,
    newStatus: ComplaintStatus,
    updatedBy: string,
    notes: string
  ) => {
    const complaintLogs = JSON.parse(localStorage.getItem("complaintLogs") || "[]");
    const newLog: ComplaintLog = {
      id: `CLOG-${Date.now()}`,
      complaintId,
      status: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy,
      notes,
    };
    complaintLogs.push(newLog);
    localStorage.setItem("complaintLogs", JSON.stringify(complaintLogs));

    // Update the complaint status in the complaints list
    const complaints = JSON.parse(localStorage.getItem("complaints") || "[]");
    const complaintIndex = complaints.findIndex((c: any) => c.id === complaintId);
    if (complaintIndex !== -1) {
      complaints[complaintIndex].status = newStatus;
      localStorage.setItem("complaints", JSON.stringify(complaints));
    }
  },

  // Get complaint history
  getComplaintHistory: (complaintId: string): ComplaintLog[] => {
    const logs = JSON.parse(localStorage.getItem("complaintLogs") || "[]");
    return logs.filter((log: ComplaintLog) => log.complaintId === complaintId);
  },

  // Get system logs
  getSystemLogs: (): LogEntry[] => {
    return JSON.parse(localStorage.getItem("systemLogs") || "[]");
  },

  // Get dashboard summary
  getDashboardSummary: () => {
    const complaints = JSON.parse(localStorage.getItem("complaints") || "[]");
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const rideRequests = JSON.parse(localStorage.getItem("rideRequests") || "[]");
    const helpConfirmations = JSON.parse(localStorage.getItem("helpConfirmations") || "[]");
    const studentConfirmations = JSON.parse(localStorage.getItem("studentHelpConfirmations") || "[]");
    
    return {
      totalComplaints: complaints.length,
      pendingComplaints: complaints.filter((c: any) => c.status === "Pending").length,
      resolvedComplaints: complaints.filter((c: any) => c.status === "Resolved").length,
      totalUsers: users.length,
      students: users.filter((u: any) => u.role === "student").length,
      helpers: users.filter((u: any) => u.role === "helper").length,
      pendingRides: rideRequests.filter((r: any) => r.status === "Pending").length,
      completedRides: rideRequests.filter((r: any) => r.status === "Completed").length,
      totalRides: rideRequests.length,
      helpConfirmations: helpConfirmations.length,
      verifiedHelpConfirmations: studentConfirmations.length,
      recentActivity: SystemLogs.getSystemLogs().slice(-5).reverse(),
    };
  },
}; 