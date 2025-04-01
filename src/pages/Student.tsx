
import { useState, useEffect } from "react";
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
import { Calendar, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

interface HelpConfirmation {
  date: string;
  helperId: string;
}

const Student = () => {
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-'));
  
  const [todayConfirmed, setTodayConfirmed] = useState(false);
  const [recentConfirmations, setRecentConfirmations] = useState<HelpConfirmation[]>([]);
  
  const form = useForm({
    defaultValues: {
      otp: "",
    }
  });

  // Check if student has already confirmed help today
  useEffect(() => {
    const storedConfirmations = localStorage.getItem('studentHelpConfirmations');
    const confirmations: HelpConfirmation[] = storedConfirmations 
      ? JSON.parse(storedConfirmations) 
      : [];
    
    setRecentConfirmations(confirmations);
    
    // Check if there's a confirmation for today
    const today = new Date().toISOString().split('T')[0];
    const todayConfirm = confirmations.find(conf => conf.date === today);
    setTodayConfirmed(!!todayConfirm);
  }, []);
  
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
    
    // Verify OTP from localStorage (in a real app, this would be server-side)
    const storedOTP = localStorage.getItem('currentHelperOTP');
    const helperId = localStorage.getItem('currentHelperId');
    
    if (otpValue !== storedOTP) {
      toast({
        title: "Incorrect OTP",
        description: "The OTP you entered is incorrect",
        variant: "destructive",
      });
      return;
    }
    
    // Save confirmation
    const today = new Date().toISOString().split('T')[0];
    const newConfirmation: HelpConfirmation = {
      date: today,
      helperId: helperId || 'unknown'
    };
    
    // Get existing confirmations
    const storedConfirmations = localStorage.getItem('studentHelpConfirmations');
    const confirmations: HelpConfirmation[] = storedConfirmations 
      ? JSON.parse(storedConfirmations) 
      : [];
    
    // Prevent multiple confirmations for the same day
    const existingTodayConfirmation = confirmations.find(conf => conf.date === today);
    if (existingTodayConfirmation) {
      toast({
        title: "Already Confirmed",
        description: "You have already confirmed help for today",
        variant: "destructive",
      });
      return;
    }
    
    // Add new confirmation and save
    confirmations.push(newConfirmation);
    localStorage.setItem('studentHelpConfirmations', JSON.stringify(confirmations));
    
    // Clear the current OTP
    localStorage.removeItem('currentHelperOTP');
    
    // Update state
    setTodayConfirmed(true);
    setRecentConfirmations(confirmations);
    
    toast({
      title: "Help confirmed",
      description: "Thank you for confirming the help provision.",
    });
    
    form.reset();
  };
  
  const getHelperName = (helperId: string) => {
    // This would be a database lookup in a real app
    const helperMap: {[key: string]: string} = {
      'john': 'John Smith',
      'maria': 'Maria Garcia',
      'james': 'James Johnson',
      'sarah': 'Sarah Williams',
    };
    
    return helperMap[helperId] || 'Unknown Helper';
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="flex flex-col md:flex-row flex-grow">
        {/* Left Panel - Help Confirmation */}
        <div className="md:w-1/3 bg-gray-300 dark:bg-gray-800 p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">HELP CONFIRMATION</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-blue-500 dark:text-blue-400">Daily confirmation</span>
          </div>
          
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Recent Confirmations</h3>
            
            {recentConfirmations.length > 0 ? (
              <div className="space-y-2">
                {recentConfirmations.slice(-3).reverse().map((conf, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{new Date(conf.date).toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm font-medium">{getHelperName(conf.helperId)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recent confirmations</p>
            )}
          </div>
          
          <div className="mt-auto">
            <Link to="/book-ride">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
                Book Free Ride
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Panel - User Profile and OTP */}
        <div className="flex-1 p-6 dark:text-white">
          <div className="flex justify-between mb-8">
            <h2 className="text-lg text-gray-500 dark:text-gray-400">confirm help provision</h2>
          </div>
          
          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32 mb-4">
              <AvatarImage src="/lovable-uploads/e0cd73f6-abe5-4757-9b0b-041be52fce22.png" alt="Grace Kusenganya" />
              <AvatarFallback>GK</AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-100">GRACE KUSENGANYA</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Any dishonesty will not be forgiven</p>
            
            <div className="flex items-center gap-2 mb-6">
              <span className="font-medium">{currentDate}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {todayConfirmed 
                  ? "You've confirmed help for today" 
                  : "confirm if your helper has assisted you today"}
              </span>
            </div>
            
            {todayConfirmed ? (
              <div className="flex flex-col items-center justify-center mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg w-full max-w-xs">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-center text-green-700 dark:text-green-400">
                  Help confirmed for today
                </p>
              </div>
            ) : (
              <>
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem className="mb-6 w-full flex justify-center">
                        <FormControl>
                          <InputOTP maxLength={4} {...field}>
                            <InputOTPGroup className="gap-4">
                              <InputOTPSlot index={0} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={1} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={2} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                              <InputOTPSlot index={3} className="w-12 h-12 border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded" />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </Form>
                
                <div className="text-center mb-6">
                  <span className="text-blue-500 dark:text-blue-400">Enter OTP provided by helper</span>
                </div>
                
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 w-full max-w-xs"
                  onClick={handleConfirm}
                >
                  Confirm
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Student;
