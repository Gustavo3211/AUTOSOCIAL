import { Check } from "lucide-react";

interface SpecsListProps {
  specs: string[];
}

export const SpecsList = ({ specs }: SpecsListProps) => {
  return (
    <div className="space-y-3">
      {specs.map((spec, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm leading-relaxed">{spec}</p>
        </div>
      ))}
    </div>
  );
};
