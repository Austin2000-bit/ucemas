
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  FileText, 
  Users, 
  Layout,
  Upload,
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
import { useAuth } from "@/utils/auth";
import { supabase } from "@/lib/supabase";
import { Complaint as ComplaintType } from "@/types";

const Complaint = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a complaint.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a complaint.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Form validation
    if (!category || !description) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields before submitting.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Create complaint in the database
      const newComplaint: Omit<ComplaintType, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        title: category,
        description,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('complaints')
        .insert([newComplaint])
        .select()
        .single();

      if (error) {
        console.error("Error submitting complaint:", error);
        throw new Error("Failed to submit complaint");
      }

      // Upload attachments if any
      if (attachments.length > 0) {
        await Promise.all(attachments.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}_${data.id}_${index}.${fileExt}`;
          const filePath = `complaints/${fileName}`;

          const { error: uploadError } = await supabase
            .storage
            .from('complaints')
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading attachment:", uploadError);
          }
        }));
      }

      // Show success message
      toast({
        title: "Complaint submitted",
        description: "Your complaint has been successfully submitted.",
      });

      // Reset form
      setCategory("");
      setDescription("");
      setAttachments([]);
      
      // Navigate to complaint list
      navigate("/complaint/list");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to submit complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-accent rounded-md transition-colors font-poppins"
                >
                  <Layout className="h-5 w-5" />
                  <span>Admin Section</span>
                </Link>
              )}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-semibold mb-6 font-poppins">Submit a Complaint</h1>
          
          <div className="max-w-2xl mx-auto bg-card rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">User Information</label>
                <div className="p-4 bg-muted/50 rounded-md">
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Attachments</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    <span>Add Files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {attachments.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {attachments.length} file(s) selected
                    </span>
                  )}
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
