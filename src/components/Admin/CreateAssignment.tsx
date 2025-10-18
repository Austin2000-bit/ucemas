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
  period_type: z.enum(["year", "semester"]),
  academic_year: z.string().optional(),
  semester: z.string().optional(),
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
      period_type: "year",
      academic_year: "",
      semester: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Check for duplicate assignment
      let duplicateCheck;
      if (values.period_type === "year") {
        duplicateCheck = await supabase
          .from('helper_student_assignments')
          .select('id')
          .eq('student_id', values.student_id)
          .eq('helper_id', values.helper_id)
          .eq('academic_year', values.academic_year);
      } else {
        duplicateCheck = await supabase
          .from('helper_student_assignments')
          .select('id')
          .eq('student_id', values.student_id)
          .eq('helper_id', values.helper_id)
          .eq('semester', values.semester);
      }
      if (duplicateCheck.data && duplicateCheck.data.length > 0) {
        toast({
          title: "Duplicate Assignment",
          description: "This assignment already exists.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check for maximum 3 active assistants per student
      let activeAssignmentsCheck;
      if (values.period_type === "year") {
        activeAssignmentsCheck = await supabase
          .from('helper_student_assignments')
          .select('id')
          .eq('student_id', values.student_id)
          .eq('status', 'active')
          .eq('academic_year', values.academic_year);
      } else {
        activeAssignmentsCheck = await supabase
          .from('helper_student_assignments')
          .select('id')
          .eq('student_id', values.student_id)
          .eq('status', 'active')
          .eq('semester', values.semester);
      }

      if (activeAssignmentsCheck.data && activeAssignmentsCheck.data.length >= 3) {
        toast({
          title: "Maximum Assistants Reached",
          description: "This student already has 3 active assistants. Please deactivate an existing assignment first.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

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
        academic_year: values.period_type === "year" ? values.academic_year : null,
        semester: values.period_type === "semester" ? values.semester : null,
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

  const getAcademicYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    for (let i = -1; i < 4; i++) {
      const start = currentYear + i;
      const end = start + 1;
      options.push(`${start}-${end}`);
    }
    return options;
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
                <FormLabel>Assistant</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistant" />
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
          
          <FormField
            control={form.control}
            name="period_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment Period</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="year">Full Academic Year</SelectItem>
                    <SelectItem value="semester">Single Semester</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("period_type") === "year" && (
            <FormField
              control={form.control}
              name="academic_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getAcademicYearOptions().map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form.watch("period_type") === "semester" && (
            <FormField
              control={form.control}
              name="semester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Semester 1">Semester 1</SelectItem>
                      <SelectItem value="Semester 2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Assignment"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CreateAssignment;
