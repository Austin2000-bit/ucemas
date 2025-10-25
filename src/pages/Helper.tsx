import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clipboard, CheckCircle, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { User, SignInRecord } from "@/types";
import { getComplaintsByUserId } from "@/lib/supabase";

// Define the shape of the confirmation data with the nested client object
interface HelpConfirmationWithClient {
  id: string;
  date: string;
  description: string;
  status: string;
  client_id: string;
  client: {
    first_name: string;
    last_name: string;
  } | null; // Client can be null if the record is missing or RLS prevents access
}

const Helper = () => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [isSigned, setIsSigned] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [signInHistory, setSignInHistory] = useState<SignInRecord[]>([]);
  const [confirmations, setConfirmations] = useState<HelpConfirmationWithClient[]>([]);
  const [assignedClients, setAssignedClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);
  const [isAllComplaintsModalOpen, setIsAllComplaintsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    console.log(`[Helper] Loading data for helper: ${user.id}`);

    try {
      // Fetch assigned clients' details
      const { data: assignedClientsData, error: assignmentsError } = await supabase
            .from('assistant_client_assignments')
            .select(`
              client:client_id (
                id,
                first_name,
                last_name,
                email,
            role
              )
            `)
            .eq('assistant_id', user.id)
        .eq('status', 'active');
      
      console.log("[Helper] Assigned clients query result:", { data: assignedClientsData, error: assignmentsError });
      if (assignmentsError) throw assignmentsError;
        
      // The 'client' property can be null if the related client record is not found or RLS blocks it.
      const myClients: User[] = (assignedClientsData || [])
        .map((a: any) => a.client)
        .filter((client: any): client is User => client !== null);

          setAssignedClients(myClients);
      console.log("[Helper] Parsed assigned clients:", myClients);
          
      // Auto-select the client if only one is assigned
      if (myClients.length === 1 && !selectedClient) {
            setSelectedClient(myClients[0].id);
        console.log(`[Helper] Auto-selecting client: ${myClients[0].id}`);
      }

      // Fetch recent help confirmations with client details
      const { data: confirmationsData, error: confirmationsError } = await supabase
        .from('client_help_confirmations')
        .select(`
          id,
          date,
          description,
          status,
          client_id,
          client:client_id (
            first_name,
            last_name
          )
        `)
        .eq('assistant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log("[Helper] Confirmations query result:", { data: confirmationsData, error: confirmationsError });
      if (confirmationsError) throw confirmationsError;
      
      setConfirmations((confirmationsData as any[]) || []);

      } catch (error) {
      console.error('Error loading helper data:', error);
          toast({
            title: "Error",
        description: "Failed to load dashboard data. Please refresh.",
            variant: "destructive",
          });
      } finally {
          setIsLoading(false);
        }
  }, [user?.id, selectedClient]);

  useEffect(() => {
    const POLL_INTERVAL = 30000; // 30 seconds
    loadData(); // Initial load
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return;
    // Fetch complaints for the assistant
    getComplaintsByUserId(user.id).then(setComplaints);
  }, [user?.id]);

  const generateOTP = async () => {
    if (!user?.id || !selectedClient) return;
    
    try {
      // First create a session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          assistant_id: user.id,
          client_id: selectedClient,
          status: 'pending_confirmation',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Generate OTP using the Edge Function
      const { data, error: otpError } = await supabase.functions.invoke('generate-otp', {
        body: { sessionId: session.id }
      });

      if (otpError || !data?.otp) {
        throw new Error(otpError?.message || 'Failed to generate OTP');
      }

      // Set the OTP in state for display
      setOtp(data.otp);
      
      // Get the selected client's name for the toast
      const selectedClientData = assignedClients.find(s => s.id === selectedClient);
      if (selectedClientData) {
        toast({
          title: "OTP Generated",
          description: `OTP has been sent to ${selectedClientData.first_name} ${selectedClientData.last_name}`,
        });
      }

      setHasCopied(false);
    } catch (error) {
      console.error('Error generating OTP:', error);
      toast({
        title: "Error",
        description: "Failed to generate OTP",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already signed in
      const { data: existingSignIn } = await supabase
        .from('assistant_sign_ins')
        .select('*')
        .eq('assistant_id', user.id)
        .eq('date', today)
        .single();

      if (existingSignIn) {
        toast({
          title: "Already signed in",
          description: "You have already signed in for today.",
        });
        return;
      }

      // Create new sign in record
      const { error: signInError } = await supabase
        .from('assistant_sign_ins')
        .insert([{
          assistant_id: user.id,
          date: today
        }]);

      if (signInError) throw signInError;

      setIsSigned(true);
      toast({
        title: "Signed in successfully",
        description: "You have successfully signed in for today.",
      });
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Error",
        description: "Failed to sign in",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !description.trim() || !user?.id) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('=== HELPER OTP GENERATION DEBUG ===');
      console.log('Assistant ID:', user.id);
      console.log('Selected Client:', selectedClient);
      console.log('Description:', description.trim());
      
      // Generate a simple 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Generated OTP:', otp);
      
      // Create a session with the OTP and description
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          assistant_id: user.id,
          client_id: selectedClient,
          otp: otp,
          description: description.trim(),
          otp_expiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
          status: 'pending_confirmation'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      console.log('Session created successfully:', sessionData);
      console.log('=== END HELPER OTP GENERATION DEBUG ===');

      // Set the OTP in state for display on the helper's UI
      setOtp(otp);
      
      const selectedClientData = assignedClients.find(s => s.id === selectedClient);
      if (selectedClientData) {
        toast({
          title: "OTP Generated",
          description: `OTP has been generated for ${selectedClientData.first_name} ${selectedClientData.last_name}. The client will receive it automatically.`,
        });
      }

      setDescription("");
      setHasCopied(false);
      
      // Reload data to update the confirmations table
      loadData();
      
    } catch (error) {
      console.error('Error submitting help confirmation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit help confirmation",
        variant: "destructive",
      });
    }
  };

  const getClientName = (clientId: string) => {
    const client = assignedClients.find(s => s.id === clientId);
    if (client) {
      return `${client.first_name} ${client.last_name}`;
    }
    
    // Fallback for confirmations if client is not in the assigned list (e.g., old assignment)
    const confirmationClient = confirmations.find(c => c.client_id === clientId)?.client;
    if (confirmationClient) {
      return `${confirmationClient.first_name} ${confirmationClient.last_name}`;
    }

    return 'Unknown Client';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar />

      <div className="flex flex-col md:flex-row flex-grow">
        <div className="md:w-1/3 bg-gray-300 dark:bg-gray-800 p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">ASSISTANCE CONFIRMATION</h2>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-blue-500 dark:text-blue-400">Daily confirmation</span>
          </div>
          
          <div className="max-w-md w-full mx-auto mb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src="/undraw_business-deal_nx2n.png" 
                  alt="Devices illustration" 
                  className="w-60 h-40 object-contain rounded-full"
                />
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Select 
                  value={selectedClient} 
                  onValueChange={setSelectedClient}
                  disabled={assignedClients.length === 1}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assigned client" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignedClients.length === 0 && (
                  <p className="text-sm text-amber-500">
                    No clients assigned to you yet. Please contact an administrator.
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Briefly describe Assistance provided..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full resize-none"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={assignedClients.length === 0}
              >
                Sign & Generate OTP
              </Button>
            </form>

            {otp && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex flex-col items-center">
                  <h3 className="font-medium mb-2">
                    OTP for {getClientName(selectedClient)}
                  </h3>
                  <div className="flex items-center gap-3 my-2">
                    <Badge variant="outline" className="text-2xl py-3 px-6 font-mono">
                      {otp}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        navigator.clipboard.writeText(otp);
                        setHasCopied(true);
                        toast({
                          title: "OTP Copied",
                          description: "OTP has been copied to clipboard.",
                        });
                      }}
                      className="flex items-center gap-1"
                    >
                      {hasCopied ? <CheckCircle className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                      {hasCopied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Share this OTP with the client to verify Assistance provision
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={generateOTP}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Generate new OTP
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col dark:text-white overflow-y-auto">
          <h1 className="text-xl font-medium mb-4 text-center">Recent Assistance Confirmations</h1>
          
          <div className="w-full mt-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="overflow-x-auto">
                  <Table className="min-w-[600px]">
                  <TableCaption>A list of recent Assistance provisions</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmations.length > 0 ? (
                      confirmations.map((conf) => (
                        <TableRow key={conf.id}>
                          <TableCell>{formatDate(conf.date)}</TableCell>
                          <TableCell>
                            {conf.client ? `${conf.client.first_name} ${conf.client.last_name}` : getClientName(conf.client_id)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{conf.description}</TableCell>
                          <TableCell>
                            <Badge 
                              className={conf.status === 'confirmed' ? 'bg-green-500' : 'text-amber-500 border-amber-500'} 
                              variant={conf.status === 'confirmed' ? 'default' : 'outline'}
                            >
                              {conf.status === 'confirmed' ? 'Verified' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          No confirmations recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Complaints Summary Card */}
          <div className="container mx-auto p-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Recent Complaints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">{complaints.length}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">
                          {complaints.filter(c => c.status === "pending").length}
                        </p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold">
                          {complaints.filter(c => c.status === "resolved").length}
                        </p>
                        <p className="text-sm text-muted-foreground">Resolved</p>
                      </div>
                    </div>
                    {/* Complaints List */}
                    {complaints.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Recent Complaints</h4>
                        {complaints.slice(0, 3).map((complaint) => (
                          <div key={complaint.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{complaint.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(complaint.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge 
                                variant={
                                  complaint.status === "resolved" ? "default" : 
                                  complaint.status === "in_progress" ? "secondary" : 
                                  "outline"
                                }
                                className="text-xs"
                              >
                                {complaint.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {complaint.description}
                            </p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setIsComplaintDialogOpen(true);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        ))}
                        {complaints.length > 3 && (
                          <div className="text-center">
                            <Button variant="outline" size="sm" onClick={() => setIsAllComplaintsModalOpen(true)}>
                              View All Complaints
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* All Complaints Modal */}
      <Dialog open={isAllComplaintsModalOpen} onOpenChange={setIsAllComplaintsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Your Complaints</DialogTitle>
            <DialogDescription>
              A complete list of all complaints you have submitted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{complaint.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      complaint.status === "resolved" ? "default" : 
                      complaint.status === "in_progress" ? "secondary" : 
                      "outline"
                    }
                    className="text-xs"
                  >
                    {complaint.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {complaint.description}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setIsComplaintDialogOpen(true);
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Button variant="outline" size="sm" onClick={() => setIsAllComplaintsModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Detail Dialog */}
      {selectedComplaint && (
        <Dialog open={isComplaintDialogOpen} onOpenChange={setIsComplaintDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complaint Details</DialogTitle>
              <DialogDescription>
                Submitted on {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleDateString() : 'N/A'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium mb-1">Category</p>
                <p className="text-sm">{selectedComplaint.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <p className="text-sm">
                  <Badge 
                    variant={
                      selectedComplaint.status === "resolved" ? "default" : 
                      selectedComplaint.status === "in_progress" ? "secondary" : 
                      "outline"
                    }
                  >
                    {selectedComplaint.status.replace('_', ' ')}
                  </Badge>
                </p>
              </div>
              {selectedComplaint.feedback && (
                <div>
                  <p className="text-sm font-medium mb-1">Admin Feedback</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedComplaint.feedback}
                  </p>
                </div>
              )}
              {selectedComplaint.follow_up && (
                <div>
                  <p className="text-sm font-medium mb-1">Follow-up Information</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedComplaint.follow_up}
                  </p>
                </div>
              )}
              {!selectedComplaint.feedback && !selectedComplaint.follow_up && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No admin response yet. Your complaint is being reviewed.
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Helper;
