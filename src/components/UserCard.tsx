import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Rocket } from "lucide-react";

interface UserCardProps {
  username: string;
  avatar: string;
  isPremium?: boolean;
  isFollowing?: boolean;
  onFollowClick?: () => void;
}

export const UserCard = ({ 
  username, 
  avatar, 
  isPremium = false,
  isFollowing = false,
  onFollowClick 
}: UserCardProps) => {
  const [following, setFollowing] = useState(isFollowing);

  const handleFollow = () => {
    setFollowing(!following);
    onFollowClick?.();
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={avatar} alt={username} />
            <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          {isPremium && (
            <div className="absolute -bottom-1 -right-1 bg-gradient-primary rounded-full p-1">
              <Rocket className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{username}</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleFollow}
        variant={following ? "outline" : "default"}
        size="sm"
        className={following ? "" : "bg-gradient-primary hover:opacity-90"}
      >
        {following ? "Seguindo" : "Seguir"}
      </Button>
    </div>
  );
};
