import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
}

export const FloatingActionButton = ({ icon: Icon, onClick, label }: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-gradient-primary shadow-glow hover:opacity-90 transition-all duration-300 hover:scale-110 z-40"
      size="icon"
      aria-label={label}
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
};
