
import { LayoutDashboard, Users, HelpingHand, FileText, Car, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const Admin = () => {
  // Navigation items for the sidebar
  const sidebarItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/admin" },
    { title: "Manage students", icon: Users, url: "/admin/students" },
    { title: "Manage Helpers", icon: HelpingHand, url: "/admin/helpers" },
    { title: "View complaints", icon: FileText, url: "/admin/complaints" },
    { title: "Ride requests", icon: Car, url: "/admin/rides" },
    { title: "Reports", icon: PieChart, url: "/admin/reports" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <div className="bg-gray-200 text-gray-600">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="font-medium">Admin</div>
          </div>
        </div>
      </div>
      
      {/* Menu navigation */}
      <div className="bg-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-12 overflow-x-auto">
            <Link to="/" className="px-4 py-2 whitespace-nowrap">USNMS</Link>
            <Link to="/register" className="px-4 py-2 whitespace-nowrap">Register</Link>
            <Link to="/helper" className="px-4 py-2 whitespace-nowrap">Helper</Link>
            <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap">Book ride</Link>
            <Link to="/complaint" className="px-4 py-2 whitespace-nowrap">Complaint</Link>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-300 min-h-[calc(100vh-6rem)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
              <h2 className="font-medium text-lg">Control center</h2>
            </div>
            
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <Link 
                  key={item.title} 
                  to={item.url} 
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-2">Total Students</h2>
              <p className="text-3xl font-bold">124</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-2">Active Helpers</h2>
              <p className="text-3xl font-bold">32</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-2">Pending Rides</h2>
              <p className="text-3xl font-bold">18</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-2">Completed Rides</h2>
              <p className="text-3xl font-bold">246</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-2">Open Complaints</h2>
              <p className="text-3xl font-bold">7</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-2">User Satisfaction</h2>
              <p className="text-3xl font-bold">94%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
