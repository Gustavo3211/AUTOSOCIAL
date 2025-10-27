import { Card } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EventCardProps {
  id: string;
  name: string;
  image: string;
  logo: string;
  date: string;
  location: string;
  price: string;
  official?: boolean;
}

export const EventCard = ({ 
  id, 
  name, 
  image, 
  logo, 
  date, 
  location, 
  price, 
  official = false 
}: EventCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glow min-w-[280px]"
      onClick={() => navigate(`/evento/${id}`)}
    >
      <div className="relative h-40">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {official && (
          <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-1 rounded-full font-semibold">
            Oficial
          </div>
        )}
        
        <div className="absolute bottom-3 left-3">
          <img 
            src={logo} 
            alt={`${name} logo`}
            className="h-10 w-10 rounded-full border-2 border-white shadow-lg"
          />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-1">{name}</h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="line-clamp-1">{date}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="line-clamp-1">{location}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-primary font-bold">{price}</span>
        </div>
      </div>
    </Card>
  );
};
