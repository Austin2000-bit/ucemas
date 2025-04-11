
import { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
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
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface SignInRecord {
  date: string;
  helper: string;
  timestamp: number;
}

interface HelpConfirmation {
  date: string;
  helper: string;
  student: string;
  description: string;
  timestamp: number;
}

interface StudentConfirmation {
  date: string;
  helperId: string;
}

const ConfirmationLogs = () => {
  const [helperSignIns, setHelperSignIns] = useState<SignInRecord[]>([]);
  const [helpConfirmations, setHelpConfirmations] = useState<HelpConfirmation[]>([]);
  const [studentConfirmations, setStudentConfirmations] = useState<StudentConfirmation[]>([]);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    // Load all sign-in and confirmation data
    const loadData = () => {
      // Helper sign-ins
      const storedSignIns = localStorage.getItem('helperSignIns');
      const signIns: SignInRecord[] = storedSignIns ? JSON.parse(storedSignIns) : [];
      setHelperSignIns(signIns);
      
      // Helper confirmations
      const storedHelpConfirmations = localStorage.getItem('helpConfirmations');
      const helpConfs: HelpConfirmation[] = storedHelpConfirmations 
        ? JSON.parse(storedHelpConfirmations) 
        : [];
      setHelpConfirmations(helpConfs);
      
      // Student confirmations
      const storedStudentConfirmations = localStorage.getItem('studentHelpConfirmations');
      const studentConfs: StudentConfirmation[] = storedStudentConfirmations 
        ? JSON.parse(storedStudentConfirmations) 
        : [];
      setStudentConfirmations(studentConfs);
    };
    
    loadData();
    
    // Set up interval to refresh data periodically
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to get display names
  const getHelperName = (helperId: string) => {
    return helperId === "amanda" ? "Amanda Kusisqanya" : helperId;
  };
  
  const getStudentName = (studentId: string) => {
    const studentMap: {[key: string]: string} = {
      'john': 'John Smith',
      'maria': 'Maria Garcia',
      'james': 'James Johnson',
      'sarah': 'Sarah Williams',
    };
    
    return studentMap[studentId] || studentId;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter data based on selected filter
  const getFilteredHelperSignIns = () => {
    let filtered = [...helperSignIns];
    
    if (filter !== "all") {
      filtered = filtered.filter(record => record.helper === filter);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(record => record.date === dateFilter);
    }
    
    return filtered;
  };
  
  const getFilteredHelpConfirmations = () => {
    let filtered = [...helpConfirmations];
    
    if (filter !== "all") {
      filtered = filtered.filter(record => 
        record.helper === filter || record.student === filter
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(record => record.date === dateFilter);
    }
    
    return filtered;
  };
  
  // Export data as CSV
  const exportCSV = (data: any[], filename: string) => {
    // Convert object array to CSV string
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    const csv = headers + '\n' + rows;
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar title="Confirmation Logs" />
      
      <div className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Confirmation Logs</h1>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="amanda">Amanda Kusisqanya</SelectItem>
                  <SelectItem value="john">John Smith</SelectItem>
                  <SelectItem value="maria">Maria Garcia</SelectItem>
                  <SelectItem value="james">James Johnson</SelectItem>
                  <SelectItem value="sarah">Sarah Williams</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <input 
                  type="date" 
                  className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                {dateFilter && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setDateFilter("")}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Activities</TabsTrigger>
                <TabsTrigger value="signins">Helper Sign-ins</TabsTrigger>
                <TabsTrigger value="confirmations">Help Confirmations</TabsTrigger>
              </TabsList>
              
              {/* All Activities Tab */}
              <TabsContent value="all" className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">All Activities</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => exportCSV([...helperSignIns, ...helpConfirmations], "all-activities")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Helper</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Combine and sort all records by date/time */}
                    {[
                      ...helperSignIns.map(record => ({
                        ...record,
                        type: 'sign-in',
                        student: '-'
                      })),
                      ...helpConfirmations.map(record => ({
                        ...record,
                        type: 'help'
                      }))
                    ]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .filter(record => 
                      (filter === "all" || record.helper === filter || record.student === filter) &&
                      (!dateFilter || record.date === dateFilter)
                    )
                    .slice(0, 50)
                    .map((record, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(record.date)}</span>
                            <span className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.type === 'sign-in' ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-500">Sign-in</Badge>
                          ) : (
                            <Badge variant="outline" className="border-purple-500 text-purple-500">Help</Badge>
                          )}
                        </TableCell>
                        <TableCell>{getHelperName(record.helper)}</TableCell>
                        <TableCell>{record.student !== '-' ? getStudentName(record.student) : '-'}</TableCell>
                        <TableCell>
                          {record.type === 'help' ? (
                            (() => {
                              // Check if student has confirmed
                              const isConfirmed = studentConfirmations.some(
                                sc => sc.date === record.date && sc.helperId === record.student
                              );
                              return isConfirmed ? (
                                <Badge className="bg-green-500">Verified</Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>
                              );
                            })()
                          ) : (
                            <Badge className="bg-blue-500">Completed</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(getFilteredHelperSignIns().length === 0 && getFilteredHelpConfirmations().length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No activities found matching the current filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              {/* Helper Sign-ins Tab */}
              <TabsContent value="signins" className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Helper Sign-ins</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => exportCSV(helperSignIns, "helper-signins")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Helper</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredHelperSignIns().length > 0 ? (
                      getFilteredHelperSignIns()
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{getHelperName(record.helper)}</TableCell>
                            <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                          No sign-ins found matching the current filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              
              {/* Help Confirmations Tab */}
              <TabsContent value="confirmations" className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Help Confirmations</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => exportCSV(helpConfirmations, "help-confirmations")}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Helper</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredHelpConfirmations().length > 0 ? (
                      getFilteredHelpConfirmations()
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{getHelperName(record.helper)}</TableCell>
                            <TableCell>{getStudentName(record.student)}</TableCell>
                            <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                            <TableCell>
                              {(() => {
                                // Check if student has confirmed
                                const isConfirmed = studentConfirmations.some(
                                  sc => sc.date === record.date && sc.helperId === record.student
                                );
                                return isConfirmed ? (
                                  <Badge className="bg-green-500">Verified</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                          No confirmations found matching the current filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ConfirmationLogs;
