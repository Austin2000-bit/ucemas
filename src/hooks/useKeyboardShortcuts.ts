import { useEffect } from "react";
import { useFontSize } from "@/components/font-size-provider";

export const useKeyboardShortcuts = () => {
  const { setFontSize } = useFontSize();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl/Cmd is pressed
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "1":
            event.preventDefault();
            setFontSize("default");
            break;
          case "2":
            event.preventDefault();
            setFontSize("medium");
            break;
          case "3":
            event.preventDefault();
            setFontSize("large");
            break;
          case "k":
            // Focus search or main input (common shortcut)
            event.preventDefault();
            const searchInput = document.querySelector('input[type="email"], input[type="text"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
            break;
          case "Enter":
            // Submit form if focused on input
            event.preventDefault();
            const form = document.querySelector('form');
            if (form && document.activeElement?.tagName === "INPUT") {
              form.requestSubmit();
            }
            break;
        }
      }

      // Escape key to clear focus
      if (event.key === "Escape") {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [setFontSize]);
};
