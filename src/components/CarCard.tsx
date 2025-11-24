import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface CarCardProps {
  model: string;
  brand: string;
  year: number;
  price: number;
  image: string;
  km: number;
  transmission: string;
  location: string;
  state: string;
}

export const CarCard = ({ 
  model, 
  brand, 
  year, 
  price, 
  image, 
  km, 
  transmission, 
  location, 
  state 
}: CarCardProps) => {
  return (
    <Card className="overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glow">
      <div className="relative aspect-video">
        <img 
          src={image} 
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
          {state}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-bold text-base mb-1">
          {brand} {model}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{year}</p>
        
        <div className="text-primary font-bold text-lg mb-2">
          R$ {price.toLocaleString('pt-BR')}
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">
          {km.toLocaleString('pt-BR')} km • {transmission}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{location}</span>
        </div>
      </div>
    </Card>
  );
};
