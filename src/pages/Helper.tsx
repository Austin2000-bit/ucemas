
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Helper = () => {
  const [selectedHelper, setSelectedHelper] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  
  const handleSignIn = () => {
    toast({
      title: "Signed in successfully",
      description: "You have successfully signed in for today.",
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHelper) {
      toast({
        title: "Helper selection required",
        description: "Please select an assigned helper",
        variant: "destructive",
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please briefly describe the help provided",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Help confirmation submitted",
      description: "Thank you for confirming the help provision.",
    });
    
    // Reset form
    setSelectedHelper("");
    setDescription("");
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <div className="bg-gray-200 text-gray-600">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="font-medium">Helper Dashboard</div>
          </div>
        </div>
      </div>
      
      {/* Menu navigation */}
      <div className="bg-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-12 overflow-x-auto">
            <Link to="/" className="px-4 py-2 whitespace-nowrap">USNMS</Link>
            <Link to="/register" className="px-4 py-2 whitespace-nowrap">Register</Link>
            <Link to="/helper" className="px-4 py-2 whitespace-nowrap font-medium">Helper</Link>
            <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap">Book ride</Link>
            <Link to="/admin" className="px-4 py-2 whitespace-nowrap">Admin</Link>
            <Link to="/complaint" className="px-4 py-2 whitespace-nowrap">Complaint</Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* User Profile Section */}
        <div className="md:w-1/3 bg-blue-400 p-6 flex flex-col items-center">
          <div className="rounded-full overflow-hidden w-32 h-32 border-4 border-white mb-4">
            <img 
              src="/lovable-uploads/4099645c-e8d9-40ed-9964-383c8452c070.png" 
              alt="Amanda Kusisqanya" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-white font-semibold text-xl mb-1">AMANDA KUSISQANYA</h2>
          <p className="text-white/80 mb-6">Special Needs Assistant</p>
          
          <Button 
            variant="outline" 
            className="bg-white/20 text-white border-white/30 hover:bg-white/30 w-full"
            onClick={handleSignIn}
          >
            Daily sign-in
          </Button>
        </div>

        {/* Help Confirmation Section */}
        <div className="flex-1 p-6 flex flex-col items-center">
          <h1 className="text-xl font-medium mb-8">Sign to confirm help provision</h1>
          
          <div className="max-w-md w-full mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src="/public/placeholder.svg" 
                  alt="Devices illustration" 
                  className="w-60 h-40 object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-blue-500 text-xl">Devices Illustration</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Select value={selectedHelper} onValueChange={setSelectedHelper}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assigned helper" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john">John Smith</SelectItem>
                    <SelectItem value="maria">Maria Garcia</SelectItem>
                    <SelectItem value="james">James Johnson</SelectItem>
                    <SelectItem value="sarah">Sarah Williams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Briefly describe help provided..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full resize-none"
                />
              </div>
              
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
                Sign
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Helper;
