
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";

const Student = () => {
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-'));
  
  const form = useForm({
    defaultValues: {
      otp: "",
    }
  });

  const handleConfirm = () => {
    const otpValue = form.getValues("otp");
    if (otpValue.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 4-digit OTP",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Help confirmed",
      description: "Thank you for confirming the help provision.",
    });
    
    form.reset();
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <div className="bg-gray-200 text-gray-600">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="font-medium">Student Dashboard</div>
          </div>
        </div>
      </div>
      
      {/* Menu navigation */}
      <div className="bg-blue-500 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-12 overflow-x-auto">
            <Link to="/" className="px-4 py-2 whitespace-nowrap">USNMS</Link>
            <Link to="/register" className="px-4 py-2 whitespace-nowrap">Register</Link>
            <Link to="/helper" className="px-4 py-2 whitespace-nowrap">Helper</Link>
            <Link to="/book-ride" className="px-4 py-2 whitespace-nowrap">Book ride</Link>
            <Link to="/admin" className="px-4 py-2 whitespace-nowrap">Admin</Link>
            <Link to="/complaint" className="px-4 py-2 whitespace-nowrap">Complaint</Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left Panel - Help Confirmation */}
        <div className="md:w-1/3 bg-gray-300 p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">HELP CONFIRMATION</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-blue-500">Daily confirmation</span>
          </div>
          
          <div className="mt-auto">
            <Link to="/book-ride">
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                Book Free Ride
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Panel - User Profile and OTP */}
        <div className="flex-1 p-6">
          <div className="flex justify-between mb-8">
            <h2 className="text-lg text-gray-500">confirm help provision</h2>
          </div>
          
          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32 mb-4">
              <AvatarImage src="/lovable-uploads/e0cd73f6-abe5-4757-9b0b-041be52fce22.png" alt="Grace Kusenganya" />
              <AvatarFallback>GK</AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-semibold text-gray-700">GRACE KUSENGANYA</h2>
            <p className="text-gray-500 mb-4">Any dishonesty will not be forgiven</p>
            
            <div className="flex items-center gap-2 mb-6">
              <span className="font-medium">{currentDate}</span>
              <span className="text-gray-500">confirm if austin has helped you today</span>
            </div>
            
            <Form {...form}>
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="mb-6 w-full flex justify-center">
                    <FormControl>
                      <InputOTP maxLength={4} {...field}>
                        <InputOTPGroup className="gap-4">
                          <InputOTPSlot index={0} className="w-12 h-12 border-gray-300 rounded" />
                          <InputOTPSlot index={1} className="w-12 h-12 border-gray-300 rounded" />
                          <InputOTPSlot index={2} className="w-12 h-12 border-gray-300 rounded" />
                          <InputOTPSlot index={3} className="w-12 h-12 border-gray-300 rounded" />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                  </FormItem>
                )}
              />
            </Form>
            
            <div className="text-center mb-6">
              <span className="text-blue-500">Enter OTP</span>
            </div>
            
            <Button 
              className="bg-blue-500 hover:bg-blue-600 w-full max-w-xs"
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Student;
