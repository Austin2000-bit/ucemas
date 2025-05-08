import { useState, useEffect } from "react";
import { useAuth } from "@/utils/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemLogs } from "@/utils/systemLogs";

interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface MessageSystemProps {
  recipient?: string;
  onClose?: () => void;
}

const MessageSystem = ({ recipient, onClose }: MessageSystemProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(recipient || null);
  const [conversations, setConversations] = useState<{ [key: string]: Message[] }>({});

  useEffect(() => {
    // Load messages from localStorage
    const storedMessages = JSON.parse(localStorage.getItem("messages") || "{}");
    setConversations(storedMessages);

    if (selectedUser) {
      setMessages(storedMessages[selectedUser] || []);
    }
  }, [selectedUser]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: user?.email || "",
      receiver: selectedUser,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Update conversations
    const updatedConversations = {
      ...conversations,
      [selectedUser]: [...(conversations[selectedUser] || []), message],
    };

    // Save to localStorage
    localStorage.setItem("messages", JSON.stringify(updatedConversations));
    setConversations(updatedConversations);
    setMessages(updatedConversations[selectedUser]);
    setNewMessage("");

    // Log the message
    SystemLogs.addLog(
      "Message Sent",
      `Message sent to ${selectedUser}`,
      user?.email || "",
      "message"
    );
  };

  const getConversationPartners = () => {
    const partners = new Set<string>();
    Object.keys(conversations).forEach(conversation => {
      const messages = conversations[conversation];
      messages.forEach(message => {
        if (message.sender !== user?.email) {
          partners.add(message.sender);
        }
        if (message.receiver !== user?.email) {
          partners.add(message.receiver);
        }
      });
    });
    return Array.from(partners);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col md:flex-row gap-4">
        {/* Conversation List - Hidden on mobile when conversation is open */}
        {(!selectedUser || window.innerWidth >= 768) && (
          <Card className="w-full md:w-64">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] md:h-[400px]">
                {getConversationPartners().map((partner) => (
                  <Button
                    key={partner}
                    variant={selectedUser === partner ? "secondary" : "ghost"}
                    className="w-full justify-start mb-2"
                    onClick={() => setSelectedUser(partner)}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{partner.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{partner}</span>
                  </Button>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Message Area */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback>{selectedUser?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle>{selectedUser || "Select a conversation"}</CardTitle>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] md:h-[400px] mb-4">
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