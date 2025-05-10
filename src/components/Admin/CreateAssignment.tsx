
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { HelperStudentAssignment, User } from "@/types";
import { SystemLogs } from "@/utils/systemLogs";

const formSchema = z.object({
  helper_id: z.string().min(1, { message: "Helper is required" }),
  student_id: z.string().min(1, { message: "Student is required" }),
  status: z.enum(["active", "inactive"]),
});

interface CreateAssignmentProps {
  onSuccess?: () => void;
  helpers: User[];
  students: User[];
}

const CreateAssignment = ({ onSuccess, helpers, students }: CreateAssignmentProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      helper_id: "",
      student_id: "",
      status: "active",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      console.log("Creating assignment:", values);

      // Get the current authenticated session to ensure proper auth
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error("Authentication session not found. Please log in again.");
      }

      // Create the new assignment
      const newAssignment = {
        helper_id: values.helper_id,
        student_id: values.student_id,
        status: values.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('helper_student_assignments')
        .insert([newAssignment])
        .select();

      if (error) {
        console.error("Error creating assignment:", error);
        if (error.code === '42501') {
          throw new Error("Permission denied. You may not have the right access level to create assignments.");
        }
        throw new Error(`Failed to create assignment: ${error.message}`);
      }

      console.log("Assignment created successfully:", data);

      // Log the action
      const helper = helpers.find(h => h.id === values.helper_id);
      const student = students.find(s => s.id === values.student_id);
      
      SystemLogs.addLog(
        "Assignment created",
        `Helper ${helper?.first_name || ""} ${helper?.last_name || ""} assigned to student ${student?.first_name || ""} ${student?.last_name || ""}`,
        "admin",
        "admin"
      );

      toast({
        title: "Assignment created",
        description: "The helper-student assignment has been created successfully.",
      });

      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast({
        title: "Error",
        description: `Failed to create assignment. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="helper_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Helper</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select helper" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {helpers.map(helper => (
                      <SelectItem key={helper.id} value={helper.id}>
                        {helper.first_name} {helper.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="student_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Assignment"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CreateAssignment;
