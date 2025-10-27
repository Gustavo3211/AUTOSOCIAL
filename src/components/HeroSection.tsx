import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; 
import heroImage from "@/assets/hero-cars.jpg";

interface HeroSectionProps {
  onPostCarClick: () => void; // A função que vem do Index
}

export const HeroSection = ({ onPostCarClick }: HeroSectionProps) => {
  return (
    <div className="relative h-64 rounded-xl overflow-hidden mb-6">
      <img 
        src={heroImage} 
        alt="Featured Cars"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-6">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Bem-vindo ao AutoGRID
          </h1>
          <p className="text-white/90 text-sm mb-4 drop-shadow">
            A maior rede social automotiva do Brasil. Compartilhe sua paixão por carros.
          </p>
          <div className="flex space-x-3">

          </div>
        </div>
      </div>
    </div>
  );
};