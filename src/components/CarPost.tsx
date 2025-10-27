import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react"; // Importe useEffect
import { supabase } from "@/superbase";


interface CarPostProps {
  id: number; // Corrigido: O ID do post é um número
  username: string;
  userAvatar?: string;
  carImage: string;
  carTitle: string;
  carSpecs: string;
  description: string;
  likes: number; // O total de likes
  comments: number;
  timestamp: string;
  category: string;
  
  // --- NOVA PROP OBRIGATÓRIA ---
  // O componente precisa saber o ID (da tabela User) do usuário logado
  currentUserProfileId: number | null;
}

export const CarPost = ({ 
  id, // ID do post
  username, 
  userAvatar, // (Você não está usando isso no avatar, só a inicial)
  carImage, 
  carTitle, 
  carSpecs, 
  description, 
  likes, 
  comments, 
  timestamp,
  category,
  currentUserProfileId // O ID do usuário logado
}: CarPostProps) => {
  
  // Estados locais para UI otimista
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [isLoading, setIsLoading] = useState(true); // Estado de loading

  // Efeito 1: Checar se o usuário JÁ curtiu este post
  useEffect(() => {
    async function checkInitialLike() {
      // Se não tem usuário logado ou não temos o ID, não faz nada
      if (!currentUserProfileId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .match({ 
          post_id: id, 
          user_id: currentUserProfileId 
        })
        .single(); // Tenta pegar uma única linha

      if (data && !error) {
        setIsLiked(true); // Achamos um like!
      } else {
        setIsLiked(false);
      }
      setIsLoading(false);
    }
    
    checkInitialLike();
  }, [id, currentUserProfileId]); // Roda se o post ou o usuário mudar

  
  // Função de Like (AGORA CONECTADA)
  const handleLike = async () => {
    // Se não está logado, não faz nada (ou abre o modal, se preferir)
    if (!currentUserProfileId) {
      alert("Você precisa estar logado para curtir!"); // Pode trocar por um modal
      return;
    }
    
    // Se já estava curtido, vamos descurtir
    if (isLiked) {
      // 1. Atualiza a UI otimista
      setIsLiked(false);
      setLikeCount(likeCount - 1);
      
      // 2. Remove do banco
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .match({ 
          post_id: id, 
          user_id: currentUserProfileId 
        });
        
      if (error) {
        console.error("Erro ao descurtir:", error.message);
        // Reverte a UI se deu erro
        setIsLiked(true);
        setLikeCount(likeCount + 1);
      }
      
    } else {
      // Se não estava curtido, vamos curtir
      // 1. Atualiza a UI otimista
      setIsLiked(true);
      setLikeCount(likeCount + 1);
      
      // 2. Insere no banco
      const { error } = await supabase
        .from('post_likes')
        .insert({ 
          post_id: id, 
          user_id: currentUserProfileId 
        });
        
      if (error) {
        console.error("Erro ao curtir:", error.message);
        // Reverte a UI se deu erro
        setIsLiked(false);
        setLikeCount(likeCount - 1);
      }
    }
  };

  return (
    <Card className="bg-card border-border shadow-card overflow-hidden">
      {/* ... (Header, Imagem, Content - sem mudanças) ... */}
      
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{username}</p>
            <p className="text-sm text-muted-foreground">{timestamp}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Car Image */}
      <div className="relative">
        <img 
          src={carImage} 
          alt={carTitle}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-foreground mb-1">{carTitle}</h3>
        <p className="text-sm text-accent mb-2">{carSpecs}</p>
        <p className="text-foreground text-sm leading-relaxed">{description}</p>
      </div>


      {/* Actions (Agora usa o 'likeCount' do estado) */}
      <div className="flex items-center justify-between p-4 pt-0">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLike}
            disabled={isLoading} // Desativa o botão enquanto checa o like
            className={`${isLiked ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
          >
            <Heart className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <MessageCircle className="h-5 w-5 mr-2" />
            {comments}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Share className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
};