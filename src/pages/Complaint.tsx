
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ChevronDown, 
  FileText, 
  Users, 
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const Complaint = () => {
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast({
        title: "Missing information",
        description: "Please select an issue category",
        variant: "destructive",
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a description of your issue",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would send the complaint data to your backend
    toast({
      title: "Complaint submitted",
      description: "Your complaint has been received. We'll get back to you soon.",
    });
    
    // Reset form
    setCategory("");
    setDescription("");
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <div className="bg-gray-200 text-gray-600">
        <div className="container mx-auto px-4">
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
            <Link to="/admin" className="px-4 py-2 whitespace-nowrap">Admin</Link>
            <Link to="/complaint" className="px-4 py-2 whitespace-nowrap font-medium">Complaint</Link>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-300 min-h-[calc(100vh-6rem)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
              <h2 className="font-medium text-lg">Complaint</h2>
            </div>
            
            <nav className="space-y-1">
              <Link 
                to="/complaint" 
                className="flex items-center gap-3 px-4 py-2.5 text-gray-600 bg-gray-200 rounded-md transition-colors"
              >
                <FileText className="h-5 w-5" />
                <span>Submit complaint</span>
              </Link>
              <Link 
                to="/complaint/list" 
                className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Complaint List</span>
              </Link>
              <Link 
                to="/admin/section" 
                className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
              >
                <Layout className="h-5 w-5" />
                <span>Admin Section</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-10 text-center uppercase">File your complaint</h1>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-center mb-8">
              <img 
                src="/lovable-uploads/1cdeff13-e3ba-40c2-928b-f4a180903dff.png" 
                alt="Person filing complaint" 
                className="w-32 h-32 object-contain"
              />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Issue Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service Issue</SelectItem>
                    <SelectItem value="helper">Helper Behavior</SelectItem>
                    <SelectItem value="app">Application Problem</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Briefly describe the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full resize-none"
                />
              </div>
              
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
                Submit
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaint;
