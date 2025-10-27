import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/superbase";

interface CarPostProps {
  id: number;
  username?: string; // opcional
  userAvatar?: string; // opcional
  carImage: string;
  carTitle: string;
  carSpecs: string;
  description: string;
  likes: number;
  comments: number;
  timestamp: string;
  category: string;
  currentUserProfileId: number | null;
}

export const CarPost = ({
  id,
  username: initialUsername,
  userAvatar: initialAvatar,
  carImage,
  carTitle,
  carSpecs,
  description,
  likes,
  comments,
  timestamp,
  category,
  currentUserProfileId,
}: CarPostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState(initialUsername || "");
  const [userAvatar, setUserAvatar] = useState(initialAvatar || "");

  // 🔸 Verifica se o usuário curtiu o post
  useEffect(() => {
    async function checkInitialLike() {
      if (!currentUserProfileId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("post_likes")
        .select("id")
        .match({ post_id: id, user_id: currentUserProfileId })
        .single();

      if (data && !error) setIsLiked(true);
      else setIsLiked(false);
      setIsLoading(false);
    }
    checkInitialLike();
  }, [id, currentUserProfileId]);

  // 🔹 Busca username/avatar caso não venham por props
  useEffect(() => {
    async function fetchUserInfo() {
      if (initialUsername && initialAvatar) return; // já veio tudo

      const { data, error } = await supabase
        .from("Posts")
        .select(`
          user_id,
          User:User (
            username,
            avatar_url
          )
        `)
        .eq("id", id)
        .single();

      if (!error && data?.User) {
        setUsername(data.User.username);
      } else {
        console.error("Erro ao buscar usuário do post:", error?.message);
      }
    }

    fetchUserInfo();
  }, [id, initialUsername, initialAvatar]);

  // 🔸 Função de curtir/descurtir
  const handleLike = async () => {
    if (!currentUserProfileId) {
      alert("Você precisa estar logado para curtir!");
      return;
    }

    if (isLiked) {
      setIsLiked(false);
      setLikeCount(likeCount - 1);
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .match({ post_id: id, user_id: currentUserProfileId });

      if (error) {
        console.error("Erro ao descurtir:", error.message);
        setIsLiked(true);
        setLikeCount(likeCount + 1);
      }
    } else {
      setIsLiked(true);
      setLikeCount(likeCount + 1);
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: id, user_id: currentUserProfileId });

      if (error) {
        console.error("Erro ao curtir:", error.message);
        setIsLiked(false);
        setLikeCount(likeCount - 1);
      }
    }
  };

  return (
    <Card className="bg-gradient-to-b from-carbon-gray/90 to-carbon-black border border-orange-500/20 shadow-[0_4px_25px_hsl(25_100%_40%_/_0.25)] overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_6px_35px_hsl(25_100%_45%_/_0.35)]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border border-amber-400/40 shadow-[0_0_8px_hsl(35_100%_60%_/_0.4)]">
            {userAvatar ? (
              <AvatarImage src={userAvatar} alt={username || "Usuário"} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold">
                {(username ? username.charAt(0) : "?").toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="font-semibold text-amber-300 drop-shadow-[0_0_6px_hsl(25_100%_50%_/_0.4)]">
              {username || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Car Image */}
      <div className="relative group">
        <img
          src={carImage}
          alt={carTitle}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        <div className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full shadow-[0_0_10px_hsl(25_100%_50%_/_0.5)]">
          {category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-bold text-white">{carTitle}</h3>
        <p className="text-sm text-amber-300 font-medium">{carSpecs}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          {/* Like */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLoading}
            className={`transition-all duration-200 ${
              isLiked
                ? "text-red-500 hover:text-red-600 scale-110"
                : "text-muted-foreground hover:text-amber-400"
            }`}
          >
            <Heart
              className={`h-5 w-5 mr-2 transition-transform ${
                isLiked ? "fill-red-500 animate-pulse" : ""
              }`}
            />
            <span className="text-sm font-medium">{likeCount}</span>
          </Button>

          {/* Comentários */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-amber-400"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">{comments}</span>
          </Button>
        </div>

        {/* Compartilhar */}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-amber-400"
        >
          <Share className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
};
