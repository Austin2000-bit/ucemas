import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/utils/auth";
import { SystemLogs } from "@/utils/systemLogs";

interface MessageSystemProps {
  recipient?: string;
  onClose?: () => void;
}

const MessageSystem: React.FC<MessageSystemProps> = ({ recipient, onClose }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();
  
  useEffect(() => {
    // Load messages from localStorage
    const storedMessages = JSON.parse(localStorage.getItem("adminMessages") || "[]");
    setMessages(storedMessages);
  }, []);

  const handleSendMessage = () => {
    if (!subject || !content) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message content.",
        variant: "destructive",
      });
      return;
    }

    const newMessage = {
      id: Date.now().toString(),
      recipient: recipient || "",
      sender: user ? `${user.first_name} ${user.last_name}` : "Admin",
      subject,
      content,
      timestamp: Date.now(),
      read: false,
    };

    const updatedMessages = [...messages, newMessage];
    localStorage.setItem("adminMessages", JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
    
    SystemLogs.addLog(
      "Message sent",
      `Message with subject "${subject}" sent to ${recipient || "all users"}`,
      user?.id || "unknown",
      user?.role || "unknown"
    );

    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${recipient || "the user"}.`,
    });

    // Reset form
    setSubject("");
    setContent("");
    
    // Close dialog if onClose is provided
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Subject
          </label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter message subject"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Message
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your message here..."
            rows={5}
          />
        </div>
        <Button onClick={handleSendMessage} className="w-full">
          Send Message
        </Button>
      </div>
    </div>
  );
};

export default MessageSystem;
