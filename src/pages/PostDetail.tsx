import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { UserCard } from "@/components/UserCard";
// 1. IMPORTAR O NOVO COMPONENTE E TIPO
import { CommentItem, CommentData as CommentType } from "@/components/CommentItem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Send, Settings, X } from "lucide-react"; // Adicionado X
import { BottomNavigation } from "@/components/BottomNavigation";
import { supabase } from "@/superbase"; // (atenção: 'superbase' ou 'supabase'?)

type UserSlim = {
  username: string;
  is_premium?: boolean;
  avatar_url?: string;
} | null;

type PostDetailData = {
  id: number;
  created_at: string;
  description: string;
  like: number;
  comments: number;
  carTitle: string;
  carImage: string;
  carSpecs: string;
  User: UserSlim;
  Category: { title: string } | null;
};

// 2. O TIPO AGORA É IMPORTADO DO COMPONENTE
type CommentData = CommentType;

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
  const [isModalOpen, setIsModalOpen] = useState(false); // (Seu estado - OK)
useEffect(() => {
    // 1. Só execute se NÃO estiver carregando E se o post existir
    if (!loading && post && window.location.hash === '#comment-input') {
      
      // 2. Dê um pequeno delay para garantir que o DOM foi "pintado"
      setTimeout(() => {
        const inputElement = document.getElementById('comment-input');
        if (inputElement) {
          inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          inputElement.focus({ preventScroll: true }); // Adicionado preventScroll
        }
      }, 100); // 100ms é um delay seguro
    }
  }, [loading, post]); // 3. 👈 A MUDANÇA PRINCIPAL ESTÁ AQUI
  // 3. NOVO ESTADO PARA GERENCIAR A RESPOSTA
  const [replyingTo, setReplyingTo] = useState<CommentData | null>(null);

  // (Todas as suas funções de lógica - getUserProfile, fetchComments, etc. - ESTÃO INTACTAS)
  const normalizeRelation = <T,>(val: any): T | null => {
    if (val == null) return null;
    if (Array.isArray(val)) return (val.length > 0 ? val[0] : null) as T | null;
    return val as T;
  };

  useEffect(() => {
    async function getUserProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = (sessionData as any)?.session;
      if (session?.user?.email) {
        const { data: profile } = await supabase
          .from("User")
          .select("id")
          .ilike("Email", session.user.email) 
          .single();
        if (profile) setCurrentUserProfileId((profile as any).id);
      }
      setIsAuthLoading(false);
    }
    getUserProfile();
  }, []);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("post_comments")
      .select(`
        id,
        created_at,
        body,
        parent_comment_id, 
        User:user_id (
          username,
          avatar_url
        )
      `)
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Erro ao buscar comentários:", error.message);
      return;
    }
    if (!data) {
      setCommentsList([]);
      return;
    }
    const commentMap = new Map<number, CommentData>();
    const parentComments: CommentData[] = [];
    const allComments: CommentData[] = (data as any[]).map((c: any) => {
      const normalizedUser = normalizeRelation<{ username: string; avatar_url?: string }>(c.User);
      return {
        id: Number(c.id),
        created_at: c.created_at,
        content: String(c.body ?? c.content ?? ""),
        parent_comment_id: c.parent_comment_id ? Number(c.parent_comment_id) : null,
        User: normalizedUser,
        replies: [],
      };
    });
    allComments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });
    allComments.forEach((comment) => {
      if (comment.parent_comment_id !== null) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        parentComments.push(comment);
      }
    });
    setCommentsList(parentComments);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    async function fetchPost() {
      const { data, error } = await supabase
        .from("Posts")
        .select(`
          id,
          created_at,
          description,
          like,
          comments,
          carTitle,
          carImage,
          carSpecs,
          User:user_id (
            username,
            is_premium
          ),
          Category:category (
            title
          )
        `)
        .eq("id", id)
        .single();
      if (error) {
        console.error("Erro ao buscar post:", error.message);
        return;
      }
      if (!data) return;
      const normalizedUser = normalizeRelation<{ username: string; is_premium?: boolean }>(data.User);
      const normalizedCategory = normalizeRelation<{ title: string }>(data.Category);
      const carImage = data.carImage ?? data.carImage ?? "";
      const carTitle = data.carTitle ?? data.carTitle ?? (data.title ?? "");
      const postObj: PostDetailData = {
        id: Number(data.id),
        created_at: data.created_at,
        description: data.description ?? "",
        like: Number(data.like ?? 0),
        comments: Number(data.comments ?? 0),
        carTitle: String(carTitle),
        carImage: String(carImage),
        carSpecs: String(data.carSpecs ?? data.carSpecs ?? ""),
        User: normalizedUser,
        Category: normalizedCategory,
      };
      setPost(postObj);
      setLikeCount(postObj.like);
      setCommentCount(postObj.comments);
    }
    async function load() {
      setLoading(true);
      await Promise.all([fetchPost(), fetchComments()]);
      setLoading(false);
    }
    load();
  }, [id, fetchComments]); 

  useEffect(() => {
    if (isAuthLoading || !post || !currentUserProfileId) return;
    async function checkInitialLike() {
      const { data } = await supabase
        .from("post_likes")
        .select("id")
        .match({ post_id: post!.id, user_id: currentUserProfileId })
        .single();
      setIsLiked(!!data);
    }
    checkInitialLike();
  }, [post, currentUserProfileId, isAuthLoading]);

  const handleLike = async () => {
    if (!currentUserProfileId) return navigate("/perfil");
    if (!post) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    const { data: newLikeCount, error } = await supabase.rpc("toggle_like", {
      post_id_input: post.id,
      user_id_input: currentUserProfileId,
    });
    if (error) {
      console.error("Erro ao curtir:", error);
      setIsLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    } else {
      setLikeCount(newLikeCount);
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
    const { error: insertError } = await supabase.from("post_comments").insert({
      post_id: post.id,
      user_id: currentUserProfileId,
      body: newComment.trim(),
      parent_comment_id: replyingTo ? replyingTo.id : null, 
    });
    if (!insertError) {
      setNewComment("");
      setReplyingTo(null); 
      await fetchComments();
      const { data: newCommentCount, error: rpcError } = await supabase.rpc(
        "update_comment_count",
        { post_id_input: post.id }
      );
      if (!rpcError) {
        setCommentCount(newCommentCount);
      }
    } else {
      console.error("Erro ao inserir comentário:", insertError.message);
    }
    setIsSubmittingComment(false);
  };

  const handleStartReply = (comment: CommentData) => {
    setReplyingTo(comment);
    document.getElementById("comment-input")?.focus();
  };

  // Render
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

  const specs = post.carSpecs ? post.carSpecs.split("•").map((s) => s.trim()) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-carbon-black via-carbon-gray/80 to-black text-foreground pb-32">
      <Header showBack />

      {/* ========================================================== */}
      {/* AQUI ESTÁ A SUA DIV DE VOLTA, COM O ONCLICK */}
      {/* ========================================================== */}
      <div
        className="relative w-full max-w-3xl mx-auto aspect-video cursor-pointer group mt-4 rounded-lg overflow-hidden shadow-lg"
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={post.carImage}
          alt={post.carTitle}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6">
        <UserCard
          username={post.User?.username || "Usuário"}
          avatar={post.User?.avatar_url || post.User?.username || ""}
          isPremium={post.User?.is_premium || false}
        />

        {/* (Resto do seu JSX - INTACTO) */}
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
        <div className="flex items-center justify-around py-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleLike} disabled={isAuthLoading} className="flex items-center gap-2 group">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                isLiked ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_15px_hsl(25_100%_50%_/_0.4)]" : "bg-card/40 border border-orange-500/30 hover:bg-card/60"
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "text-white fill-white" : "text-orange-400"}`} />
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

        <div className="space-y-3 pb-6">
          <h2 className="text-xl font-bold text-white">Comentários ({commentCount})</h2>
          {commentsList.length > 0 ? (
            commentsList.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onStartReply={handleStartReply} 
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Seja o primeiro a comentar!</p>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {replyingTo && (
            <div className="flex justify-between items-center text-sm px-2">
              <span className="text-muted-foreground">
                Respondendo a <span className="text-amber-400">{replyingTo.User?.username}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2 border-t border-orange-500/20 pt-4">
            <Input
              id="comment-input" 
              placeholder={replyingTo ? "Escreva sua resposta..." : "Adicione um comentário..."}
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
      </div> {/* (div de fechamento do 'max-w-lg' - INTACTA) */}

      {/* ========================================================== */}
      {/* SEU MODAL (no lugar correto) */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-0"
          onClick={() => setIsModalOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-[51] text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setIsModalOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <img
            src={post.carImage}
            alt={post.carTitle}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
