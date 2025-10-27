import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  gradient?: string;
  onClick?: () => void;
}

export const CategoryCard = ({ title, description, image, gradient, onClick }: CategoryCardProps) => {
  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glow group bg-gradient-to-br ${gradient}`}
      onClick={onClick}
    >
      <div className="absolute inset-0">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      
      <div className="relative p-6 h-40 flex flex-col justify-end">
        <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
          {title}
        </h3>
        <p className="text-white/90 text-sm drop-shadow">
          {description}
        </p>
      </div>
    </Card>
  );
};