import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface UserSuggestionsProps {
  onSelect: (user: User) => void;
  selectedUser?: User;
  className?: string;
}

const UserSuggestions = ({ onSelect, selectedUser, className }: UserSuggestionsProps) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      
      // Load users from localStorage
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Ensure we have an array of users
      if (!Array.isArray(storedUsers)) {
        throw new Error('Invalid data format in localStorage');
      }

      setUsers(storedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDisplayName = (user: User) => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={loading}
        >
          {selectedUser ? getDisplayName(selectedUser) : "Select user..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandGroup>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.email}
                onSelect={() => {
                  onSelect(user);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {getDisplayName(user)}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({user.role})
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSuggestions; 