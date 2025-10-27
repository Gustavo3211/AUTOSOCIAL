import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// 1. Importe 'Check' para o feedback de "copiado" e 'Share2' (é melhor que 'Share')
import { Heart, MessageCircle, Share2, MoreHorizontal, Check } from "lucide-react";
// 2. Importe MouseEvent, useNavigate e useState
import { useState, useEffect, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabase";

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

  // 3. Adicione o estado 'isCopied' e o 'navigate'
  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();

  // 🔸 Verifica se o usuário curtiu o post (Seu código, está OK)
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

  // 🔹 Busca username/avatar (Seu código, está OK)
  useEffect(() => {
    async function fetchUserInfo() {
      if (initialUsername && initialAvatar) return;
      const { data, error } = await supabase
        .from("Posts")
        .select(`User:User (username, avatar_url)`)
        .eq("id", id)
        .single();
      if (!error && data?.User) {
        const user = data.User as { username: string; avatar_url?: string };
        setUsername(user.username);
        setUserAvatar(user.avatar_url || "");
      } else {
        console.error("Erro ao buscar usuário do post:", error?.message);
      }
    }
    fetchUserInfo();
  }, [id, initialUsername, initialAvatar]);

  // 4. ❗ FUNÇÃO DE LIKE CORRIGIDA (USANDO RPC) ❗
  const handleLike = async (e: MouseEvent) => {
    e.stopPropagation(); // Impede o card de ser clicado
    if (!currentUserProfileId) {
      alert("Você precisa estar logado para curtir!");
      return;
    }
    if (isLoading) return; // Previne cliques duplos

    // Atualização Otimista
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));

    // Chama a RPC para atualizar o DB corretamente
    const { data: newLikeCount, error } = await supabase.rpc("toggle_like", {
      post_id_input: id,
      user_id_input: currentUserProfileId,
    });

    if (error) {
      console.error("Erro ao processar like:", error);
      // Reverte a UI em caso de erro
      setIsLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    } else {
      // Sincroniza o estado com a contagem real vinda do DB
      setLikeCount(newLikeCount);
    }
  };

  // 5. NOVA FUNÇÃO DE COMENTÁRIO
  const handleCommentClick = (e: MouseEvent) => {
    e.stopPropagation(); // Impede o card de ser clicado
    // Navega para o post e adiciona o hash para o scroll
    navigate(`/posts/${id}#comment-input`);
  };

  // 6. NOVA FUNÇÃO DE COMPARTILHAR
  const handleShareClick = (e: MouseEvent) => {
    e.stopPropagation(); // Impede o card de ser clicado
    const postUrl = `${window.location.origin}/posts/${id}`;
    
    navigator.clipboard.writeText(postUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reseta o ícone após 2s
    }).catch(err => {
      console.error("Falha ao copiar link: ", err);
      alert("Falha ao copiar link.");
    });
  };

  // 7. NOVA FUNÇÃO (APENAS PARA PARAR PROPAGAÇÃO)
  const handleMoreClick = (e: MouseEvent) => {
    e.stopPropagation();
    // Lógica para abrir menu/modal
    alert("Menu 'Mais' clicado!");
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
            {/* Formatando a data (opcional, mas melhor) */}
            <p className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          onClick={handleMoreClick} // 8. Adicionado onClick
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Car Image */}
      {/* (Seu JSX da imagem está ótimo, sem mudanças) */}
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
      {/* (Seu JSX de conteúdo está ótimo, sem mudanças) */}
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
            onClick={handleLike} // 9. onClick atualizado
            disabled={isLoading}
            className={`transition-all duration-200 ${
              isLiked
                ? "text-red-500 hover:text-red-600 scale-110"
                : "text-muted-foreground hover:text-amber-400"
            }`}
          >
            <Heart
              className={`h-5 w-5 mr-2 transition-transform ${
                isLiked ? "fill-red-500" : "" // Tirei o 'animate-pulse', é mto distrativo
              }`}
            />
            <span className="text-sm font-medium">{likeCount}</span>
          </Button>

          {/* Comentários */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-amber-400"
            onClick={handleCommentClick} // 10. Adicionado onClick
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
          onClick={handleShareClick} // 11. Adicionado onClick
          disabled={isCopied} // Desativa o botão rapidamente
        >
          {isCopied ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            // Usei Share2, é mais bonito
            <Share2 className="h-5 w-5" />
          )}
        </Button>
      </div>
    </Card>
  );
};