
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Users, 
  Layout,
  Search,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";

// Define complaint type
interface Complaint {
  id: string;
  name: string;
  email: string;
  issueCategory: string;
  description: string;
  created: string;
  status: string;
  feedback: string;
  followUp: string;
}

const ComplaintList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const filters = ["All", "Pending", "Resolved", "Rejected", "Created"];
  
  // Load complaints from localStorage
  useEffect(() => {
    const storedComplaints = JSON.parse(localStorage.getItem("complaints") || "[]");
    setComplaints(storedComplaints);
  }, []);
  
  const filteredComplaints = complaints.filter(complaint => {
    // Apply search filter
    if (searchQuery && !complaint.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (activeFilter !== "All" && complaint.status !== activeFilter) {
      return false;
    }
    
    return true;
  });

  // Handle view complaint details
  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsViewOpen(true);
  };

  // Export complaints to CSV
  const exportToCSV = () => {
    const headers = ["ID", "Name", "Email", "Category", "Description", "Created", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredComplaints.map(c => 
        [
          c.id,
          `"${c.name}"`,
          `"${c.email}"`,
          `"${c.issueCategory}"`,
          `"${c.description.replace(/"/g, '""')}"`,
          c.created,
          c.status
        ].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "complaints.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Complaint Management" />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-muted/50 dark:bg-muted min-h-[calc(100vh-6rem)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
              <h2 className="font-medium text-lg font-poppins">Complaint</h2>
            </div>
            
            <nav className="space-y-1">
              <Link 
                to="/complaint" 
                className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-accent rounded-md transition-colors font-poppins"
              >
                <FileText className="h-5 w-5" />
                <span>Submit complaint</span>
              </Link>
              <Link 
                to="/complaint/list" 
                className="flex items-center gap-3 px-4 py-2.5 text-foreground bg-accent rounded-md transition-colors font-poppins"
              >
                <Users className="h-5 w-5" />
                <span>Complaint List</span>
              </Link>
              <Link 
                to="/admin" 
                className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-accent rounded-md transition-colors font-poppins"
              >
                <Layout className="h-5 w-5" />
                <span>Admin Section</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold font-poppins">Complaint List</h1>
            
            <Button onClick={exportToCSV} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="flex items-center mb-6 max-w-md relative">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for complaint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Button variant="outline" size="icon" className="ml-2">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Filter tabs */}
          <div className="flex items-center border-b mb-6 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`px-6 py-2 font-medium text-sm hover:text-blue-500 border-b-2 transition-colors font-poppins ${
                  activeFilter === filter 
                    ? "border-blue-500 text-blue-500" 
                    : "border-transparent text-muted-foreground"
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          
          {/* Complaints table */}
          <div className="bg-card rounded-md shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 font-poppins">ID</TableHead>
                  <TableHead className="font-poppins">Name</TableHead>
                  <TableHead className="font-poppins">Category</TableHead>
                  <TableHead className="w-32 font-poppins">Created</TableHead>
                  <TableHead className="w-24 font-poppins">Status</TableHead>
                  <TableHead className="w-24 text-right font-poppins">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium font-poppins">{complaint.id}</TableCell>
                      <TableCell className="font-poppins">{complaint.name}</TableCell>
                      <TableCell className="font-poppins">{complaint.issueCategory}</TableCell>
                      <TableCell className="font-poppins">{complaint.created}</TableCell>
                      <TableCell className="font-poppins">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          complaint.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                          complaint.status === "Resolved" ? "bg-green-100 text-green-800" :
                          complaint.status === "Rejected" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {complaint.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewComplaint(complaint)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No complaints found. <Link to="/complaint" className="text-blue-500 hover:underline">Submit a complaint</Link>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredComplaints.length > 0 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Detail Dialog */}
      {selectedComplaint && (
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complaint Details</DialogTitle>
              <DialogDescription>
                ID: {selectedComplaint.id} • {selectedComplaint.created}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Submitted By</p>
                  <p className="text-sm">{selectedComplaint.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Email</p>
                  <p className="text-sm">{selectedComplaint.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Category</p>
                <p className="text-sm">{selectedComplaint.issueCategory}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <p className="text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedComplaint.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                    selectedComplaint.status === "Resolved" ? "bg-green-100 text-green-800" :
                    selectedComplaint.status === "Rejected" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedComplaint.status}
                  </span>
                </p>
              </div>
              {selectedComplaint.feedback && (
                <div>
                  <p className="text-sm font-medium mb-1">Admin Feedback</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedComplaint.feedback}</p>
                </div>
              )}
              {selectedComplaint.followUp && (
                <div>
                  <p className="text-sm font-medium mb-1">Follow-up Information</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedComplaint.followUp}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ComplaintList;
