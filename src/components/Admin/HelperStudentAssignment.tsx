import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { SystemLogs } from "@/utils/systemLogs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  disability_type?: string;
  assistant_type?: string;
  assistant_specialization?: string;
}

interface Assignment {
  id: string;
  student_id: string;
  helper_id: string;
  status: string;
  created_at: string;
  academic_year: string;
  student?: User;
  helper?: User;
}

const HelperStudentAssignment = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [helpers, setHelpers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedHelper, setSelectedHelper] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Generate academic years (current year and next 2 years)
  const currentYear = new Date().getFullYear();
  const academicYears = [0, 1, 2].map(offset => {
    const startYear = currentYear + offset;
    return `${startYear}-${startYear + 1}`;
  });

  // Load users and assignments from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load students
        const { data: studentsData, error: studentsError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'student');

        if (studentsError) throw studentsError;

        // Load helpers
        const { data: helpersData, error: helpersError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'helper');

        if (helpersError) throw helpersError;

        // Load assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('helper_student_assignments')
          .select(`
            *,
            student:users!student_id(*),
            helper:users!helper_id(*)
          `);

        if (assignmentsError) throw assignmentsError;

        setStudents(studentsData || []);
        setHelpers(helpersData || []);
        setAssignments(assignmentsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAssign = async () => {
    if (!selectedStudent || !selectedHelper || !selectedYear) {
      toast({
        title: "Error",
        description: "Please select a student, helper, and academic year.",
        variant: "destructive",
      });
      return;
    }

    // Check if student already has an active assignment for the selected academic year
    const existingAssignment = assignments.find(
      a => a.student_id === selectedStudent && 
          a.status === 'active' && 
          a.academic_year === selectedYear
    );

    if (existingAssignment) {
      toast({
        title: "Error",
        description: "This student already has an active assignment for the selected academic year.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('helper_student_assignments')
        .insert([
          {
            student_id: selectedStudent,
            helper_id: selectedHelper,
            status: 'active',
            academic_year: selectedYear
          }
        ])
        .select(`
          *,
          student:users!student_id(*),
          helper:users!helper_id(*)
        `)
        .single();

      if (error) throw error;

      setAssignments([...assignments, data]);
      setSelectedStudent("");
      setSelectedHelper("");
      setSelectedYear("");
      setIsCreateDialogOpen(false);

      // Log the assignment
      const student = students.find(s => s.id === selectedStudent);
      const helper = helpers.find(h => h.id === selectedHelper);
      if (student && helper) {
        SystemLogs.addLog(
          "Helper Assignment",
          `Assigned helper ${helper.first_name} ${helper.last_name} to student ${student.first_name} ${student.last_name} for academic year ${selectedYear}`,
          "admin",
          "admin"
        );
      }

      toast({
        title: "Success",
        description: "Helper assigned successfully.",
      });
    } catch (error) {
      console.error('Error assigning helper:', error);
      toast({
        title: "Error",
        description: "Failed to assign helper. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('helper_student_assignments')
        .update({ status: 'inactive' })
        .eq('id', assignmentId);

      if (error) throw error;

      setAssignments(assignments.map(a => 
        a.id === assignmentId ? { ...a, status: 'inactive' } : a
      ));

      toast({
        title: "Success",
        description: "Helper unassigned successfully.",
      });
    } catch (error) {
      console.error('Error unassigning helper:', error);
      toast({
        title: "Error",
        description: "Failed to unassign helper. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assistant-Student Assignments</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>Manage assistant-student assignments for different academic years</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Disability Type</TableHead>
                <TableHead>Helper</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {assignment.student?.first_name} {assignment.student?.last_name}
                  </TableCell>
                  <TableCell>{assignment.student?.disability_type || '-'}</TableCell>
                  <TableCell>
                    {assignment.helper?.first_name} {assignment.helper?.last_name}
                  </TableCell>
                  <TableCell>{assignment.helper?.assistant_specialization || '-'}</TableCell>
                  <TableCell>{assignment.academic_year}</TableCell>
                  <TableCell>
                    <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {assignment.status === 'active' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnassign(assignment.id)}
                      >
                        Unassign
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No assignments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Assign a helper to a student for a specific academic year
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.disability_type || 'No disability type'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Helper</Label>
              <Select value={selectedHelper} onValueChange={setSelectedHelper}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a helper" />
                </SelectTrigger>
                <SelectContent>
                  {helpers.map((helper) => (
                    <SelectItem key={helper.id} value={helper.id}>
                      {helper.first_name} {helper.last_name} ({helper.assistant_specialization || 'No specialization'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign}>Create Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelperStudentAssignment; 