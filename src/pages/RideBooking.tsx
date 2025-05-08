
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import GoogleMap from "@/components/GoogleMap";
import { useAuth } from "@/utils/auth";
import { v4 as uuidv4 } from "uuid";

// Define types for form data
interface RideFormData {
  pickupLocation: string;
  destination: string;
  date: string;
  time: string;
  disabilityType: string;
  additionalNotes: string;
}

const RideBooking = () => {
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState<RideFormData>({
    pickupLocation: "",
    destination: "",
    date: "",
    time: "",
    disabilityType: "",
    additionalNotes: "",
  });
  
  const { user } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      disabilityType: value,
    }));
  };

  const onRouteCalculated = (duration: string) => {
    console.log("Route duration:", duration);
    setEstimatedTime(duration);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.pickupLocation || !formData.destination || !formData.date || 
        !formData.time || !formData.disabilityType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get existing ride requests or create new array
      const existingRequests = JSON.parse(localStorage.getItem("rideRequests") || "[]");
      
      // Add new request with the user's information
      const newRequest = {
        id: uuidv4(),
        studentName: user ? `${user.first_name} ${user.last_name}` : "Guest User",
        studentEmail: user?.email || "guest@example.com",
        pickupLocation: formData.pickupLocation,
        destination: formData.destination,
        date: formData.date,
        time: formData.time,
        status: "pending",
        disabilityType: formData.disabilityType,
        additionalNotes: formData.additionalNotes,
        estimatedTime: estimatedTime || "5-10 minutes"
      };
      
      existingRequests.push(newRequest);
      localStorage.setItem("rideRequests", JSON.stringify(existingRequests));
      
      // Show success message
      toast({
        title: "Ride Requested",
        description: "Your ride request has been submitted successfully!",
      });
      
      // Reset form
      setFormData({
        pickupLocation: "",
        destination: "",
        date: "",
        time: "",
        disabilityType: "",
        additionalNotes: "",
      });
      setEstimatedTime(null);
      
    } catch (error) {
      console.error("Error submitting ride request:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar title="Book a Ride" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Book Assistive Transportation</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="pickupLocation">Pickup Location</Label>
                  <Input
                    id="pickupLocation"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleInputChange}
                    placeholder="Enter pickup location"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="disabilityType">Type of Disability</Label>
                  <Select
                    value={formData.disabilityType}
                    onValueChange={handleSelectChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select disability type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobility">Mobility Impairment</SelectItem>
                      <SelectItem value="visual">Visual Impairment</SelectItem>
                      <SelectItem value="hearing">Hearing Impairment</SelectItem>
                      <SelectItem value="cognitive">Cognitive Disability</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  placeholder="Any special requirements or information"
                  rows={3}
                />
              </div>
              
              {formData.pickupLocation && formData.destination && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Route Preview</h2>
                  <GoogleMap
                    pickupLocation={formData.pickupLocation}
                    destination={formData.destination}
                    onRouteCalculated={onRouteCalculated}
                  />
                  
                  {estimatedTime && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
                      <p className="text-sm font-medium">
                        Estimated travel time: <span className="text-blue-600 dark:text-blue-400">{estimatedTime}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <Button type="submit" className="w-full">Book Ride</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideBooking;
