
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Navigation, X } from "lucide-react";

const RideBooking = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [isRouteSelected, setIsRouteSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("5-7");
  
  // Predefined locations for the demo
  const locations = [
    "Berlin International Airport Terminal 1",
    "Berlin International Airport Terminal 2",
    "Berlin International Airport Terminal 3",
    "Science Building",
    "Student Center",
    "Main Library",
    "University Gate",
    "Sports Complex"
  ];
  
  const handleFindDriver = () => {
    if (!pickupLocation || !destination) {
      toast({
        title: "Missing information",
        description: "Please select pickup and destination locations",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate finding a driver
    setTimeout(() => {
      setIsLoading(false);
      setIsRouteSelected(true);
      
      toast({
        title: "Driver found!",
        description: "Austin will arrive in 2 minutes with a Bajaj",
      });
    }, 2000);
  };
  
  const handleBookRide = () => {
    toast({
      title: "Ride booked successfully!",
      description: "Your free Bajaj ride has been booked. Austin is on the way.",
    });
  };
  
  const handleCancel = () => {
    setIsRouteSelected(false);
    setPickupLocation("");
    setDestination("");
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
          <div className="flex items-center h-12 overflow-x-auto justify-center">
            <Link to="/" className="px-4 py-2 whitespace-nowrap">USNMS</Link>
            <Link to="/register" className="px-4 py-2 whitespace-nowrap">Register</Link>
            <Link to="/helper" className="px-4 py-2 whitespace-nowrap">Helper</Link>
            <Link to="/student" className="px-4 py-2 whitespace-nowrap">Student</Link>
            <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap font-bold">Book ride</Link>
            <Link to="/admin" className="px-4 py-2 whitespace-nowrap">Admin</Link>
            <Link to="/complaint" className="px-4 py-2 whitespace-nowrap">Complaint</Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-500 text-white p-4 text-center text-xl font-bold">
            BOOK RIDE
          </div>
          
          <div className="p-4">
            {!isRouteSelected ? (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-700 flex justify-between items-center">
                  Your route
                  {pickupLocation && destination && (
                    <button onClick={handleCancel} className="text-red-500">
                      <X size={18} />
                    </button>
                  )}
                </h2>
                
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-blue-500" size={18} />
                  <Input
                    className="pl-10"
                    placeholder="Pickup location"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    list="pickup-locations"
                  />
                  <datalist id="pickup-locations">
                    {locations.map((location, index) => (
                      <option key={`pickup-${index}`} value={location} />
                    ))}
                  </datalist>
                </div>
                
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-red-500" size={18} />
                  <Input
                    className="pl-10"
                    placeholder="Destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    list="destination-locations"
                  />
                  <datalist id="destination-locations">
                    {locations.map((location, index) => (
                      <option key={`dest-${index}`} value={location} />
                    ))}
                  </datalist>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleFindDriver}
                  disabled={!pickupLocation || !destination || isLoading}
                >
                  {isLoading ? "Finding driver..." : "Find driver"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-700">Ride details</h2>
                
                <div className="bg-gray-100 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-blue-500" />
                      <span className="text-sm font-medium">{pickupLocation}</span>
                    </div>
                  </div>
                  
                  <div className="border-l-2 border-dashed border-gray-300 h-6 ml-[9px]"></div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-red-500" />
                      <span className="text-sm font-medium">{destination}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock size={18} />
                    <span className="text-sm font-medium">Estimated arrival time</span>
                  </div>
                  <span className="text-sm font-bold">{estimatedTime} min</span>
                </div>
                
                <div className="flex justify-between items-center bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Navigation size={18} />
                    <span className="text-sm font-medium">Vehicle type</span>
                  </div>
                  <span className="text-sm font-bold">Bajaj</span>
                </div>
                
                <div className="flex justify-between items-center bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Cost</span>
                  </div>
                  <span className="text-sm font-bold text-green-500">Free</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-500 hover:bg-blue-600" 
                    onClick={handleBookRide}
                  >
                    Book ride
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideBooking;