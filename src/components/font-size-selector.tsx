import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useFontSize } from "@/components/font-size-provider";
import { Type, ChevronDown } from "lucide-react";

const FontSizeSelector = () => {
  const { fontSize, setFontSize } = useFontSize();

  const fontSizes = [
    { value: "default", label: "Default (18px)", shortcut: "Ctrl+1" },
    { value: "medium", label: "Medium (20px)", shortcut: "Ctrl+2" },
    { value: "large", label: "Large (24px)", shortcut: "Ctrl+3" }
  ] as const;

  const currentFontSize = fontSizes.find(f => f.value === fontSize);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Type className="h-4 w-4" />
          <span className="hidden sm:inline">{currentFontSize?.label}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {fontSizes.map((font) => (
          <DropdownMenuItem
            key={font.value}
            onClick={() => setFontSize(font.value)}
            className="flex items-center justify-between"
          >
            <span>{font.label}</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              {font.shortcut}
            </kbd>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FontSizeSelector;
