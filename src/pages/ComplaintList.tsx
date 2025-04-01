
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Users, 
  Layout,
  Search,
  Filter,
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
import Navbar from "@/components/Navbar";

// Sample complaint data
const sampleComplaints = [
  { id: "C1", name: "Founder Break-Even Calculator", issueCategory: "Compatible", created: "21.03.2021" },
  { id: "C2", name: "Founder Break-Even Calculator", issueCategory: "Merger", created: "21.03.2021" },
  { id: "C3", name: "Founder Break-Even Calculator", issueCategory: "Compatible", created: "21.03.2021" },
  { id: "C4", name: "Founder Break-Even Calculator", issueCategory: "Compatible", created: "21.03.2021" },
  { id: "C5", name: "Founder Break-Even Calculator", issueCategory: "Merger", created: "21.03.2021" },
  { id: "C6", name: "Founder Break-Even Calculator", issueCategory: "Compatible", created: "21.03.2021" },
  { id: "C7", name: "Founder Break-Even Calculator", issueCategory: "Compatible", created: "21.03.2021" },
  { id: "C8", name: "Founder Break-Even Calculator", issueCategory: "Merger", created: "21.03.2021" },
  { id: "C9", name: "Founder Break-Even Calculator", issueCategory: "Compatible", created: "21.03.2021" },
];

const ComplaintList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  
  const filters = ["All", "Pending", "Resolved", "Rejected", "Created"];
  
  const filteredComplaints = sampleComplaints.filter(complaint => {
    // Apply search filter
    if (searchQuery && !complaint.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply status filter (for demo purposes, we're not filtering by status since we don't have that field)
    if (activeFilter !== "All") {
      // In a real application, you would filter by the status field
      return true;
    }
    
    return true;
  });
  
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
                to="/admin/section" 
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
          <h1 className="text-2xl font-semibold mb-6 font-poppins">Complaint List</h1>
          
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
          <div className="flex items-center border-b mb-6">
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
                  <TableHead className="w-24 font-poppins">Complaint ID</TableHead>
                  <TableHead className="font-poppins">Name</TableHead>
                  <TableHead className="font-poppins">Issue category</TableHead>
                  <TableHead className="w-32 font-poppins">Created</TableHead>
                  <TableHead className="w-24 text-right font-poppins">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium font-poppins">{complaint.id}</TableCell>
                    <TableCell className="font-poppins">{complaint.name}</TableCell>
                    <TableCell className="font-poppins">{complaint.issueCategory}</TableCell>
                    <TableCell className="font-poppins">{complaint.created}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 16 16" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            d="M2 14H14M8 2V11M8 11L4 7M8 11L12 7" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
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
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
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
        </div>
      </div>
    </div>
  );
};

export default ComplaintList;