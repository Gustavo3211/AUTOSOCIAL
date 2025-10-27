import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface ProductCardProps {
  name: string;
  image: string;
  price: number;
  location: string;
  state: string;
}

export const ProductCard = ({ name, image, price, location, state }: ProductCardProps) => {
  return (
    <Card className="overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glow">
      <div className="relative aspect-square">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
          {state}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 min-h-[40px]">{name}</h3>
        
        <div className="text-primary font-bold text-lg mb-2">
          R$ {price.toLocaleString('pt-BR')}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{location}</span>
        </div>
      </div>
    </Card>
  );
};
