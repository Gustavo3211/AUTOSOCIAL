import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
 // Verifique o nome do seu arquivo
import { Header } from "@/components/Header";
import { UserCard } from "@/components/UserCard";
import { CommentItem } from "@/components/CommentItem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Send, Settings } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { supabase } from "@/superbase";

// --- TIPOS DE DADOS (POST JÁ ESTÁ CORRETO) ---
type PostDetailData = {
  id: number;
  created_at: string;
  description: string;
  like: number;
  comments: number;
  carTitle: string; 
  carImage: string;
  carSpecs: string;
  User: {
    username: string;
    avatar_url: string;
    is_premium: boolean;
  }[] | null;
  Category: {
    title: string;
  }[] | null;
};

// --- TIPO COMMENTDATA CORRIGIDO ---
type CommentData = {
  id: number;
  created_at: string;
  content: string;
  User: { // O usuário que comentou
    username: string;
    avatar_url: string;
  }[] | null; // <-- CORREÇÃO: Adicionado '[]'
};
// --- FIM DOS TIPOS ---

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<PostDetailData | null>(null);
  const [commentsList, setCommentsList] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<number | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  
  // EFEITO 1: Descobrir quem está logado (Sem mudança)
  useEffect(() => {
    async function getUserProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const { data: profile } = await supabase
          .from('User')
          .select('id')
          .eq('Email', session.user.email.toLowerCase())
          .single();
        if (profile) {
          setCurrentUserProfileId(profile.id);
        }
      }
      setIsAuthLoading(false);
    }
    getUserProfile();
  }, []);

  // EFEITO 2: Buscar os dados do Post e os Comentários (Sem mudança na lógica)
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchPost() {
      const { data, error } = await supabase
        .from('Posts')
        .select(`
          id, created_at, description, like, comments,
          carTitle:carTitle, carImage:carImage, carSpecs:carSpecs,
          User ( username, avatar_url, is_premium ),
          Category ( title )
        `)
        .eq('id', id)
        .single(); 

      if (error || !data) {
        console.error("Erro ao buscar post:", error?.message);
        setPost(null);
      } else {
        setPost(data); 
        setLikeCount(data.like);
        setCommentCount(data.comments);
      }
    }
    
    async function fetchComments() {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id, created_at, content,
          User ( username, avatar_url )
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true }); 

      if (error) {
        console.error("Erro ao buscar comentários:", error.message);
      } else if (data) {
        // Esta linha (127) agora funciona
        setCommentsList(data); 
      }
    }

    async function loadPageData() {
      setLoading(true);
      await Promise.all([fetchPost(), fetchComments()]);
      setLoading(false);
    }
    
    loadPageData();

  }, [id]);

  // EFEITO 3: Checar se o post já foi curtido (Sem mudança)
  useEffect(() => {
    if (isAuthLoading || !post || !currentUserProfileId) {
      return;
    }
    async function checkInitialLike() {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .match({ 
          post_id: post.id, 
          user_id: currentUserProfileId 
        })
        .single();

      if (data && !error) {
        setIsLiked(true);
      } else {
        setIsLiked(false);
      }
    }
    checkInitialLike();
  }, [post, currentUserProfileId, isAuthLoading]);


  // --- FUNÇÕES DE INTERAÇÃO ---

  const handleLike = async () => {
    if (!currentUserProfileId) {
      navigate('/profile'); 
      return;
    }
    if (!post) return;

    if (isLiked) {
      setIsLiked(false);
      setLikeCount(likeCount - 1);
      await supabase
        .from('post_likes')
        .delete()
        .match({ post_id: post.id, user_id: currentUserProfileId });
    } else {
      setIsLiked(true);
      setLikeCount(likeCount + 1);
      await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: currentUserProfileId });
    }
  };

  const handleShare = async () => {
    if (!post) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.carTitle,
          text: post.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (!currentUserProfileId) {
      navigate('/profile'); 
      return;
    }
    if (!post || newComment.trim() === "") return;

    setIsSubmittingComment(true);

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: post.id,
        user_id: currentUserProfileId,
        content: newComment.trim()
      });
    
    if (error) {
      console.error("Erro ao comentar:", error.message);
    } else {
      // Recarrega os comentários
      const { data } = await supabase
        .from('post_comments')
        .select(`id, created_at, content, User ( username, avatar_url )`)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
        
      if (data) {
        // Esta linha (dentro do handleCommentSubmit) agora também funciona
        setCommentsList(data); 
      }
      
      setNewComment(""); 
      setCommentCount(commentCount + 1); 
    }
    setIsSubmittingComment(false);
  };


  // --- RENDERIZAÇÃO ---

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <Header showBack showMenu />
        <div className="text-center py-20">Carregando post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <Header showBack showMenu />
        <div className="text-center py-20">Post não encontrado.</div>
      </div>
    );
  }

  const specs = post.carSpecs.split('•').map(s => s.trim());

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header showBack showMenu />

      {/* Hero Image */}
      <div className="relative w-full aspect-video">
        <img 
          src={post.carImage} 
          alt={post.carTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-lg mx-auto">
        {/* User Info (Corrigido) */}
        <UserCard 
          username={post.User?.[0]?.username || 'Usuário'}
          avatar={post.User?.[0]?.avatar_url}
          isPremium={post.User?.[0]?.is_premium || false}
        />

        {/* Post Content (Corrigido) */}
        <div className="px-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{post.carTitle}</h1>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {post.Category?.[0]?.title || 'Sem Categoria'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{post.description}</p>
          </div>

          {/* Technical Specs */}
          <Card className="p-4 bg-card/50">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Dados Técnicos</h2>
            </div>
            <div className="space-y-2">
              {specs.map((spec, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm">{spec}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Interaction Bar */}
          <div className="flex items-center gap-4 py-4">
            <Button
              variant="ghost"
              onClick={handleLike}
              className="flex-1 gap-2"
              disabled={isAuthLoading} 
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isLiked ? 'bg-primary' : 'bg-primary/20'
              }`}>
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-white text-white' : 'text-primary'}`} />
              </div>
              <span className="font-semibold">{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              className="flex-1 gap-2"
            >
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold">{commentCount}</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleShare}
              className="flex-1"
            >
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
            </Button>
          </div>

          {/* Comments Section (CORRIGIDO) */}
          <div>
            <h2 className="text-xl font-bold mb-4">Comentários ({commentCount})</h2>
            <div className="space-y-2">
              {commentsList.length > 0 ? (
                commentsList.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    username={comment.User?.[0]?.username || 'Usuário'} // <-- CORREÇÃO: [0]
                    avatar={comment.User?.[0]?.avatar_url} // <-- CORREÇÃO: [0]
                    comment={comment.content}
                    timestamp={comment.created_at} 
                    likes={0} 
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Seja o primeiro a comentar!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
            disabled={isSubmittingComment}
          />
          <Button 
            size="icon" 
            className="bg-gradient-primary"
            onClick={handleCommentSubmit}
            disabled={isSubmittingComment || newComment.trim() === ""}
          >
            {isSubmittingComment ? "..." : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}