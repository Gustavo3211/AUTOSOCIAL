import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface FilterChip {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface FilterChipsProps {
  chips: FilterChip[];
  activeChip: string;
  onChipClick: (id: string) => void;
}

export const FilterChips = ({ chips, activeChip, onChipClick }: FilterChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const isActive = activeChip === chip.id;
        
        return (
          <Button
            key={chip.id}
            onClick={() => onChipClick(chip.id)}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={`whitespace-nowrap ${
              isActive 
                ? "bg-primary hover:bg-primary/90" 
                : "hover:bg-muted"
            }`}
          >
            {Icon && <Icon className="h-4 w-4 mr-2" />}
            {chip.label}
          </Button>
        );
      })}
    </div>
  );
};
