import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface GadgetLoan {
  id: string;
  fullName: string;
  regNumber: string;
  course: string;
  disabilityType: string;
  gadgetTypes: string[];
  dateBorrowed: string;
  dateReturned?: string;
  status: "active" | "returned";
}

const AdminGadgetLending = () => {
  const [loans, setLoans] = useState<GadgetLoan[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    regNumber: "",
    course: "",
    disabilityType: "",
    gadgetTypes: [] as string[],
  });

  // Load loans from localStorage
  useEffect(() => {
    const storedLoans = JSON.parse(localStorage.getItem("gadgetLoans") || "[]");
    setLoans(storedLoans);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (gadgetType: string) => {
    setFormData(prev => {
      const newGadgetTypes = prev.gadgetTypes.includes(gadgetType)
        ? prev.gadgetTypes.filter(type => type !== gadgetType)
        : [...prev.gadgetTypes, gadgetType];
      return { ...prev, gadgetTypes: newGadgetTypes };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fullName || !formData.regNumber || !formData.course || 
        !formData.disabilityType || formData.gadgetTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select at least one gadget",
        variant: "destructive",
      });
      return;
    }

    const newLoan: GadgetLoan = {
      id: Date.now().toString(),
      ...formData,
      dateBorrowed: new Date().toISOString(),
      status: "active",
    };

    const updatedLoans = [...loans, newLoan];
    localStorage.setItem("gadgetLoans", JSON.stringify(updatedLoans));
    setLoans(updatedLoans);
    setFormData({
      fullName: "",
      regNumber: "",
      course: "",
      disabilityType: "",
      gadgetTypes: [],
    });
    setIsAdding(false);
    
    toast({
      title: "Success",
      description: "Gadget loan recorded successfully",
    });
  };

  const handleReturn = (id: string) => {
    const updatedLoans = loans.map(loan => 
      loan.id === id 
        ? { 
            ...loan, 
            status: "returned",
            dateReturned: new Date().toISOString()
          } 
        : loan
    );
    
    localStorage.setItem("gadgetLoans", JSON.stringify(updatedLoans));
    setLoans(updatedLoans);
    
    toast({
      title: "Success",
      description: "Gadget returned successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gadget Lending Management</h2>
        <Button onClick={() => setIsAdding(true)}>Issue Gadget</Button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">New Gadget Loan</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="regNumber">Registration Number</Label>
                <Input
                  id="regNumber"
                  name="regNumber"
                  value={formData.regNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label>Disability Type</Label>
                <Select
                  value={formData.disabilityType}
                  onValueChange={(value) => handleSelectChange("disabilityType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select disability type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="albinism">Albinism</SelectItem>
                    <SelectItem value="multiple">Multiple Disability</SelectItem>
                    <SelectItem value="undefined">Undefined</SelectItem>
                    <SelectItem value="visual">Visual Impairment</SelectItem>
                    <SelectItem value="hearing">Hearing Impairment</SelectItem>
                    <SelectItem value="mobility">Mobility Impairment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Gadget Types</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="laptop"
                    checked={formData.gadgetTypes.includes("laptop")}
                    onCheckedChange={() => handleCheckboxChange("laptop")}
                  />
                  <Label htmlFor="laptop">Laptop</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tablet"
                    checked={formData.gadgetTypes.includes("tablet")}
                    onCheckedChange={() => handleCheckboxChange("tablet")}
                  />
                  <Label htmlFor="tablet">Tablet</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="voiceRecorder"
                    checked={formData.gadgetTypes.includes("voiceRecorder")}
                    onCheckedChange={() => handleCheckboxChange("voiceRecorder")}
                  />
                  <Label htmlFor="voiceRecorder">Voice Recorder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="handLens"
                    checked={formData.gadgetTypes.includes("handLens")}
                    onCheckedChange={() => handleCheckboxChange("handLens")}
                  />
                  <Label htmlFor="handLens">Hand Lens</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orbitReader"
                    checked={formData.gadgetTypes.includes("orbitReader")}
                    onCheckedChange={() => handleCheckboxChange("orbitReader")}
                  />
                  <Label htmlFor="orbitReader">Orbit Reader 20</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="brailleNote"
                    checked={formData.gadgetTypes.includes("brailleNote")}
                    onCheckedChange={() => handleCheckboxChange("brailleNote")}
                  />
                  <Label htmlFor="brailleNote">Braille Note Touch Plus</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="crutch"
                    checked={formData.gadgetTypes.includes("crutch")}
                    onCheckedChange={() => handleCheckboxChange("crutch")}
                  />
                  <Label htmlFor="crutch">Crutch</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Reg Number</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Disability</TableHead>
              <TableHead>Gadgets</TableHead>
              <TableHead>Date Borrowed</TableHead>
              <TableHead>Date Returned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.length > 0 ? (
              loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.fullName}</TableCell>
                  <TableCell>{loan.regNumber}</TableCell>
                  <TableCell>{loan.course}</TableCell>
                  <TableCell>{loan.disabilityType}</TableCell>
                  <TableCell>{loan.gadgetTypes.join(", ")}</TableCell>
                  <TableCell>{new Date(loan.dateBorrowed).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {loan.dateReturned ? new Date(loan.dateReturned).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      loan.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {loan.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {loan.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReturn(loan.id)}
                      >
                        Mark as Returned
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No gadget loans recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminGadgetLending; 