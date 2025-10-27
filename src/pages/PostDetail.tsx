import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    is_premium: boolean;
  } | null;
  Category: {
    title: string;
  } | null;
};

type CommentData = {
  id: number;
  created_at: string;
  content: string;
  User: {
    username: string;
  } | null;
};

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

  // 🔹 EFEITO 1: Identificar usuário autenticado
  useEffect(() => {
    async function getUserProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const { data: profile } = await supabase
          .from("User")
          .select("id")
          .eq("Email", session.user.email.toLowerCase())
          .single();
        if (profile) setCurrentUserProfileId(profile.id);
      }
      setIsAuthLoading(false);
    }
    getUserProfile();
  }, []);

  // 🔹 EFEITO 2: Buscar post + comentários
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchPost() {
      const { data, error } = await supabase
        .from("Posts")
        .select(`
          id, created_at, description, like, comments,
          carTitle, carImage, carSpecs,
          User ( username, is_premium ),
          Category ( title )
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        setPost({
          ...data,
          User: data.User || null,
          Category: data.Category || null,
        });
        setLikeCount(data.like);
        setCommentCount(data.comments);
      } else {
        console.error("Erro ao buscar post:", error?.message);
      }
    }

    async function fetchComments() {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          id, created_at, content,
          User ( username, avatar_url )
        `)
        .eq("post_id", id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setCommentsList(
          data.map((comment) => ({
            ...comment,
            User: comment.User || null,
          }))
        );
      } else {
        console.error("Erro ao buscar comentários:", error?.message);
      }
    }

    async function load() {
      setLoading(true);
      await Promise.all([fetchPost(), fetchComments()]);
      setLoading(false);
    }
    load();
  }, [id]);

  // 🔹 EFEITO 3: Verificar se o post já foi curtido
  useEffect(() => {
    if (isAuthLoading || !post || !currentUserProfileId) return;
    async function checkInitialLike() {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .match({ post_id: post.id, user_id: currentUserProfileId })
        .single();
      setIsLiked(!!data);
    }
    checkInitialLike();
  }, [post, currentUserProfileId, isAuthLoading]);

  // 🔸 FUNÇÕES DE INTERAÇÃO
  const handleLike = async () => {
    if (!currentUserProfileId) return navigate("/perfil");
    if (!post) return;

    setIsLiked(!isLiked);
    setLikeCount((c) => (isLiked ? c - 1 : c + 1));

    if (isLiked) {
      await supabase.from("post_likes").delete().match({ post_id: post.id, user_id: currentUserProfileId });
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserProfileId });
    }
  };

  const handleShare = async () => {
    if (!post) return;
    if (navigator.share) {
      await navigator.share({
        title: post.carTitle,
        text: post.description,
        url: window.location.href,
      });
    }
  };

  const handleCommentSubmit = async () => {
    if (!currentUserProfileId) return navigate("/perfil");
    if (!post || newComment.trim() === "") return;

    setIsSubmittingComment(true);
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: post.id, user_id: currentUserProfileId, content: newComment.trim() });

    if (!error) {
      const { data } = await supabase
        .from("post_comments")
        .select(`id, created_at, content, User ( username )`)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (data) setCommentsList(data);
      setNewComment("");
      setCommentCount((c) => c + 1);
    }
    setIsSubmittingComment(false);
  };

  // 🔹 RENDERIZAÇÃO
  if (loading)
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center text-muted-foreground">
        Carregando post...
      </div>
    );

  if (!post)
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center text-muted-foreground">
        Post não encontrado.
      </div>
    );

  const specs = post.carSpecs.split("•").map((s) => s.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-carbon-black via-carbon-gray/80 to-black text-foreground pb-32">
      <Header showBack />

      {/* Hero */}
      <div className="relative w-full aspect-video">
        <img
          src={post.carImage}
          alt={post.carTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6">
        <UserCard
          username={post.User?.username || "Usuário"}
          avatar={post.User?.username}
          isPremium={post.User?.is_premium || false}
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_hsl(35_100%_60%_/_0.3)]">
              {post.carTitle}
            </h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-orange-600 to-amber-500 text-white">
              {post.Category?.title || "Sem Categoria"}
            </Badge>
          </div>
          <p className="text-white/80 leading-relaxed">{post.description}</p>
        </div>

        <Card className="p-4 bg-gradient-to-br from-carbon-gray/60 to-carbon-black border border-orange-500/20 shadow-[0_4px_30px_hsl(25_100%_40%_/_0.25)]">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white/90">Dados Técnicos</h2>
          </div>
          <div className="space-y-2">
            {specs.map((spec, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="text-sm text-white/80">{spec}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Interações */}
        <div className="flex items-center justify-around py-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={handleLike}
            disabled={isAuthLoading}
            className="flex items-center gap-2 group"
          >
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                isLiked
                  ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_15px_hsl(25_100%_50%_/_0.4)]"
                  : "bg-card/40 border border-orange-500/30 hover:bg-card/60"
              }`}
            >
              <Heart
                className={`h-5 w-5 ${
                  isLiked ? "text-white fill-white" : "text-orange-400"
                }`}
              />
            </div>
            <span className="font-semibold text-white">{likeCount}</span>
          </Button>

          <Button variant="ghost" className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-card/40 border border-amber-500/30 flex items-center justify-center hover:bg-card/60 transition-all">
              <MessageCircle className="h-5 w-5 text-amber-400" />
            </div>
            <span className="font-semibold text-white">{commentCount}</span>
          </Button>

          <Button variant="ghost" onClick={handleShare}>
            <div className="h-12 w-12 rounded-full bg-card/40 border border-orange-400/30 flex items-center justify-center hover:bg-card/60 transition-all">
              <Share2 className="h-5 w-5 text-orange-400" />
            </div>
          </Button>
        </div>

        {/* Comentários */}
        <div className="space-y-3 pb-6">
          <h2 className="text-xl font-bold text-white">Comentários ({commentCount})</h2>
          {commentsList.length > 0 ? (
            commentsList.map((comment) => (
              <CommentItem
                key={comment.id}
                username={comment.User?.username || "Usuário"}
                avatar={comment.User?.username}
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

        {/* Campo de comentário */}
        <div className="flex gap-2 border-t border-orange-500/20 pt-4 mb-4">
          <Input
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-card/30 border border-orange-500/20 text-white placeholder:text-white/50"
            disabled={isSubmittingComment}
          />
          <Button
            size="icon"
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105 shadow-[0_0_15px_hsl(25_100%_50%_/_0.4)] transition-transform"
            onClick={handleCommentSubmit}
            disabled={isSubmittingComment || newComment.trim() === ""}
          >
            {isSubmittingComment ? "..." : <Send className="h-4 w-4 text-white" />}
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
