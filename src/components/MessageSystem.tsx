import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/utils/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface MessageSystemProps {
  onClose?: () => void;
}

const MessageSystem = ({ onClose }: MessageSystemProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationPartners, setConversationPartners] = useState<Set<string>>(new Set());

  // Load users from Supabase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('*');

        if (error) throw error;

        // Filter out current user and show only relevant users based on role
        const filteredUsers = users.filter((u: User) => {
          if (!u || !u.email) return false;
          if (u.email === user?.email) return false;
          
          // If current user is admin, show all users
          if (user?.role === "admin") return true;
          
          // If current user is driver, show only students and admins
          if (user?.role === "driver") {
            return u.role === "student" || u.role === "admin";
          }
          
          // If current user is student, show only drivers and admins
          if (user?.role === "student") {
            return u.role === "driver" || u.role === "admin";
          }
          
          return false;
        });
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        setUsers([]);
      }
    };

    loadUsers();
  }, [user]);

  // Load messages and update conversation partners
  useEffect(() => {
    if (!user?.email) return;

    const loadMessages = async () => {
      try {
        console.log('Loading messages for user:', user.email);
        
        // Get messages where user is either sender or recipient
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender.eq.${user.email},recipient.eq.${user.email}`)
          .order('timestamp', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          throw error;
        }

        console.log('Loaded messages:', messages);

        // Get unique conversation partners
        const partners = new Set<string>();
        messages.forEach((msg: Message) => {
          if (msg.sender === user.email) {
            partners.add(msg.recipient);
          } else if (msg.recipient === user.email) {
            partners.add(msg.sender);
          }
        });
        setConversationPartners(partners);

        // If a user is selected, filter messages for their conversation
        if (selectedUser) {
          const conversationMessages = messages.filter((msg: Message) => 
            (msg.sender === user.email && msg.recipient === selectedUser) ||
            (msg.sender === selectedUser && msg.recipient === user.email)
          );
          console.log('Filtered conversation messages:', conversationMessages);
          setMessages(conversationMessages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
        setConversationPartners(new Set());
      }
    };

    loadMessages();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `recipient=eq.${user.email}`
        }, 
        (payload) => {
          console.log('Received new message:', payload);
          const newMessage = payload.new as Message;
          if (newMessage.sender === selectedUser || newMessage.recipient === selectedUser) {
            setMessages(prev => [...prev, newMessage]);
          }
          setConversationPartners(prev => new Set([...prev, newMessage.sender]));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedUser, user?.email]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user?.email) return;

    try {
      console.log('Sending message:', {
        to: selectedUser,
        from: user.email,
        content: newMessage
      });

      const message: Message = {
        id: `msg-${Date.now()}`,
        sender: user.email,
        recipient: selectedUser,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Insert message into Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);

      // Update local state
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      setConversationPartners(prev => new Set([...prev, selectedUser]));

      // Show success message
      toast({
        title: "Message sent",
        description: `Message has been sent to ${getDisplayName(selectedUser)}`,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!u || !u.email) return false;
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = u.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const getDisplayName = (email: string) => {
    if (!email) return 'Unknown User';
    const user = users.find((u) => u?.email === email);
    if (!user) return email;
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || email;
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex gap-4 h-full">
        {/* User List */}
        <Card className="w-64">
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  if (!user || !user.email) return null;
                  const hasConversation = conversationPartners.has(user.email);
                  return (
                    <Button
                      key={user.email}
                      variant={selectedUser === user.email ? "secondary" : "ghost"}
                      className={`w-full justify-start ${hasConversation ? 'font-semibold' : ''}`}
                      onClick={() => setSelectedUser(user.email)}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>
                          {(user.firstName?.[0] || '')}{(user.lastName?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {user.firstName || ''} {user.lastName || ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.role || 'User'}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Area */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>
              {selectedUser ? `Chat with ${getDisplayName(selectedUser)}` : "Select a user to start chatting"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[500px]">
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === user?.email ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === user?.email
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedUser && (
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessageSystem; 