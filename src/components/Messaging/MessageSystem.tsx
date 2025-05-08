
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminMessage } from "@/types";
import { useAuth } from "@/utils/auth";

const MessageSystem = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [newMessage, setNewMessage] = useState({
    recipient: "",
    subject: "",
    content: ""
  });
  const [recipients, setRecipients] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    // Load messages from localStorage
    const storedMessages = JSON.parse(localStorage.getItem("adminMessages") || "[]");
    if (user) {
      // Filter messages for current user
      const userMessages = storedMessages.filter((msg: AdminMessage) => 
        msg.recipient === user.id || msg.recipient === "all"
      );
      setMessages(userMessages);
    }

    // Load potential recipients (users)
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userRecipients = users.map((u: any) => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name} (${u.role})`
    }));
    setRecipients(userRecipients);
  }, [user]);

  const handleMessageClick = (message: AdminMessage) => {
    setSelectedMessage(message);
    
    // Mark message as read if it hasn't been read
    if (!message.read) {
      const updatedMessages = messages.map(msg => 
        msg.id === message.id ? { ...msg, read: true } : msg
      );
      setMessages(updatedMessages);
      
      // Update in localStorage too
      const allMessages = JSON.parse(localStorage.getItem("adminMessages") || "[]");
      const updatedAllMessages = allMessages.map((msg: AdminMessage) => 
        msg.id === message.id ? { ...msg, read: true } : msg
      );
      localStorage.setItem("adminMessages", JSON.stringify(updatedAllMessages));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMessage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendMessage = () => {
    if (!newMessage.recipient || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to send a message.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get existing messages
      const existingMessages = JSON.parse(localStorage.getItem("adminMessages") || "[]");
      
      // Create new message
      const message: AdminMessage = {
        id: Date.now().toString(),
        recipient: newMessage.recipient,
        subject: newMessage.subject,
        content: newMessage.content,
        timestamp: Date.now(),
        read: false
      };
      
      // Add to localStorage
      existingMessages.push(message);
      localStorage.setItem("adminMessages", JSON.stringify(existingMessages));
      
      // Reset form
      setNewMessage({
        recipient: "",
        subject: "",
        content: ""
      });
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "There was an error sending your message.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox" className="p-4">
          {messages.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No messages found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Message List */}
              <div className="md:col-span-1 border-r pr-4">
                <h3 className="font-medium mb-4">Messages</h3>
                <div className="space-y-2">
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      className={`p-2 rounded cursor-pointer ${
                        selectedMessage?.id === message.id 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${!message.read ? 'font-semibold' : ''}`}
                    >
                      <p className="text-sm truncate">{message.subject}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleDateString()}
                      </p>
                      {!message.read && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Message Content */}
              <div className="md:col-span-2">
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedMessage.subject}</h2>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedMessage.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="border-t border-b py-4">
                      <p className="whitespace-pre-line">{selectedMessage.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Select a message to view its contents</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="compose" className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <select
                id="recipient"
                name="recipient"
                value={newMessage.recipient}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select recipient</option>
                <option value="all">All Users</option>
                {recipients.map(recipient => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={newMessage.subject}
                onChange={handleInputChange}
                placeholder="Enter message subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                name="content"
                value={newMessage.content}
                onChange={handleInputChange}
                placeholder="Type your message here..."
                rows={6}
              />
            </div>
            
            <Button onClick={handleSendMessage}>Send Message</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessageSystem;
