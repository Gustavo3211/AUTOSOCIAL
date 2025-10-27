import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";

interface CommentItemProps {
  username: string;
  avatar: string;
  comment: string;
  timestamp: string;
  likes?: number;
}

export const CommentItem = ({ 
  username, 
  avatar, 
  comment, 
  timestamp,
  likes = 0
}: CommentItemProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <div className="flex gap-3 p-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatar} alt={username} />
        <AvatarFallback>{username[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">{username}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        
        <p className="text-sm mb-2">{comment}</p>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className="h-auto p-0 hover:bg-transparent"
        >
          <Heart 
            className={`h-4 w-4 mr-1 ${liked ? "fill-primary text-primary" : ""}`}
          />
          <span className="text-xs">{likeCount}</span>
        </Button>
      </div>
    </div>
  );
};
