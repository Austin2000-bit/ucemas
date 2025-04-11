
import { useState, useEffect } from "react";
import {
  Bell,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db, AdminMessage } from "@/lib/supabase";

interface AdminMessagesProps {
  userId: string;
}

const AdminMessages = ({ userId }: AdminMessagesProps) => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const userMessages = await db.getAdminMessages(userId);
        setMessages(userMessages);
        setUnreadCount(userMessages.filter(msg => !msg.read).length);
      } catch (error) {
        console.error('Error loading admin messages:', error);
      }
    };
    
    loadMessages();
    
    // Set up interval to check for new messages
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [userId]);
  
  const markAsRead = async (message: AdminMessage) => {
    if (!message.id || message.read) return;
    
    const success = await db.markMessageAsRead(message.id);
    
    if (success) {
      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, read: true } : msg
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative p-2" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Admin Messages</SheetTitle>
          <SheetDescription>
            Messages from system administrators
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No messages from administrators
            </div>
          ) : (
            <ScrollArea className="h-[70vh]">
              <div className="space-y-4">
                {messages.sort((a, b) => b.timestamp - a.timestamp).map((message, i) => (
                  <div 
                    key={message.id || i} 
                    className={`p-4 rounded-lg border ${message.read 
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                      : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'}`}
                    onClick={() => !message.read && markAsRead(message)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{message.subject}</h4>
                      {!message.read && (
                        <Badge variant="outline" className="text-blue-500 border-blue-500">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {message.content}
                    </p>
                    <div className="text-xs text-gray-500 flex justify-between items-center">
                      <span>{formatDate(message.timestamp)}</span>
                      <SheetClose asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminMessages;
