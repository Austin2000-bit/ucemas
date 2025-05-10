
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/utils/auth";
import { SystemLogs } from "@/utils/systemLogs";
import { supabase } from "@/lib/supabase";

const complaintCategories = [
  "Safety Concern",
  "Assistance Concern",
  "Helper Concern",
  "Driver Concern",
];

const formSchema = z.object({
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
});

const Complaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a complaint.",
          variant: "destructive",
        });
        return;
      }

      // Get the current authenticated session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast({
          title: "Error",
          description: "Authentication session not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Create the complaint object with the logged-in user's ID
      const newComplaint = {
        user_id: user.id,
        title: values.category,
        description: values.description,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Creating complaint:", newComplaint);

      // Save to Supabase with auth token from session
      const { data, error } = await supabase
        .from('complaints')
        .insert([newComplaint])
        .select();

      if (error) {
        console.error("Error creating complaint:", error);
        if (error.code === '42501') {
          throw new Error("Permission denied. You may not have the right access level to submit complaints.");
        }
        throw new Error("Failed to create complaint");
      }

      console.log("Complaint created successfully:", data);

      // Add to system logs
      SystemLogs.addLog(
        "Complaint submitted",
        `New complaint submitted by ${user.first_name} ${user.last_name}`,
        user.id,
        user.role
      );

      toast({
        title: "Complaint submitted!",
        description: "Your complaint has been submitted successfully.",
      });

      form.reset();
      navigate("/student");
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast({
        title: "Error",
        description: `Failed to submit complaint: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar title="Submit Complaint" />
      <div className="container mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-500 text-white p-4 text-center text-xl font-bold">
            SUBMIT A COMPLAINT
          </div>
          <div className="p-4 space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {complaintCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Please select the category that best matches your complaint.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your complaint here."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe your complaint in detail.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Submitting..." : "Submit Complaint"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaint;
