// src/components/UserCard.tsx

import { Link } from "react-router-dom"; // 1. IMPORTE O LINK
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rocket } from "lucide-react";

type UserCardProps = {
  username: string;
  avatar: string;
  isPremium: boolean;
};

// (Estou assumindo que seu UserCard se parece com isso)
export function UserCard({ username, avatar, isPremium }: UserCardProps) {
  
  // Se o usuário for nulo/fallback, não adicione link
  if (username === "Usuário") {
    return (
      <div className="flex items-center gap-3 py-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-muted-foreground">Usuário Anônimo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-4">
      {/* 2. ENVOLVA O AVATAR COM O LINK */}
      <Link to={`/perfil/${username}`}>
        <Avatar className="h-12 w-12 border-2 border-primary/50">
          <AvatarImage src={avatar} alt={username} />
          <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex flex-col">
        {/* 3. ENVOLVA O NOME COM O LINK */}
        <Link to={`/perfil/${username}`} className="text-lg font-bold text-white hover:underline">
          {username}
        </Link>
        {isPremium && (
          <Badge variant="secondary" className="w-fit bg-gradient-primary text-primary-foreground">
            <Rocket className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>
    </div>
  );
}
