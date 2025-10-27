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
    <Card className="relative overflow-hidden cursor-pointer rounded-2xl bg-gradient-to-b from-carbon-gray/90 to-carbon-black border border-orange-500/20 shadow-[0_4px_25px_hsl(25_100%_40%_/_0.25)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_35px_hsl(25_100%_45%_/_0.35)]">
      
      {/* Imagem do produto */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 transition-opacity hover:opacity-90" />

        {/* Estado do item (novo, usado, etc.) */}
        <div className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full shadow-[0_0_10px_hsl(25_100%_50%_/_0.5)]">
          {state}
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-4">
        <h3 className="font-bold text-base text-white tracking-wide drop-shadow-[0_0_6px_hsl(25_100%_50%_/_0.3)] line-clamp-2 min-h-[42px]">
          {name}
        </h3>

        <div className="text-lg font-extrabold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_hsl(35_100%_60%_/_0.4)] mt-2 mb-3">
          R$ {price.toLocaleString("pt-BR")}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-amber-400" />
          <span className="line-clamp-1 text-white/90">{location}</span>
        </div>
      </div>

      {/* Glow inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500/60 to-transparent blur-[2px]" />
    </Card>
  );
};
