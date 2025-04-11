
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FileText, 
  Users, 
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Complaint = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Form validation
    if (!name || !email || !category || !description) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields before submitting.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Get existing complaints or initialize new array
    const existingComplaints = JSON.parse(localStorage.getItem("complaints") || "[]");
    
    // Create new complaint with generated ID
    const newComplaint = {
      id: `C${existingComplaints.length + 1}`,
      name,
      email,
      issueCategory: category,
      description,
      created: new Date().toLocaleDateString(),
      status: "Pending",
      feedback: "",
      followUp: "",
    };

    // Add to existing complaints
    existingComplaints.push(newComplaint);
    localStorage.setItem("complaints", JSON.stringify(existingComplaints));

    // Show success message
    toast({
      title: "Complaint submitted",
      description: "Your complaint has been successfully submitted.",
    });

    // Reset form
    setName("");
    setEmail("");
    setCategory("");
    setDescription("");
    setIsSubmitting(false);

    // Navigate to complaint list
    navigate("/complaint/list");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Submit Complaint" />
      
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
                className="flex items-center gap-3 px-4 py-2.5 text-foreground bg-accent rounded-md transition-colors font-poppins"
              >
                <FileText className="h-5 w-5" />
                <span>Submit complaint</span>
              </Link>
              <Link 
                to="/complaint/list" 
                className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-accent rounded-md transition-colors font-poppins"
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
          <h1 className="text-2xl font-semibold mb-6 font-poppins">Submit a Complaint</h1>
          
          <div className="max-w-2xl mx-auto bg-card rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">Issue Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical Issue</SelectItem>
                    <SelectItem value="Billing">Billing Issue</SelectItem>
                    <SelectItem value="Service">Service Issue</SelectItem>
                    <SelectItem value="Safety">Safety Concern</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  placeholder="Please provide details about your complaint..."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none w-full"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-blue-500 hover:bg-blue-600" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Complaint"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaint;
