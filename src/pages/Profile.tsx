import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Session, User as AuthUser } from "@supabase/supabase-js";
 
import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Flame, MessageSquare, Rocket, LogOut } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/superbase";


// ... (Tipos UserProfile, UserPost, UserComment - sem mudança) ...
type UserProfile = {
  id: number;
  username: string;
  Email: string; 
  avatar_url?: string;
  bio?: string;
  is_premium?: boolean;
};

type UserPost = {
  id: number;
  carImage: string;
  carTitle: string;
};

type UserComment = {
  id: number;
  body: string;
  created_at: string;
  post: {
    id: number;
    carTitle: string;
  } | null;
};


// -----------------------------------------------------------------
// 1. APAGUE O 'AuthModal' ANTIGO DO SEU 'Profile.tsx'
// 2. COLE ESTE NO LUGAR
// -----------------------------------------------------------------

function AuthModal({ onLoginSuccess }: { onLoginSuccess: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); 
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    });
    if (error) setError(error.message);
    else if (data.session) onLoginSuccess(data.session);
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const normalizedEmail = email.toLowerCase();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password,
    });
    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }
    if (authData.session && authData.user) {
      const { error: profileError } = await supabase
        .from('User')
        .insert({ username: username, Email: normalizedEmail });
      if (profileError) setError("Cadastro criado, mas falha ao criar perfil: " + profileError.message);
      else onLoginSuccess(authData.session);
    } else {
      setError("Cadastro realizado! Verifique seu email para logar.");
    }
    setIsSubmitting(false);
  };

  // O 'return' estava faltando os formulários:
  return (
    <DialogContent className="sm:max-w-md">
       <DialogHeader>
        <DialogTitle className="text-center text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          AutoSocial
        </DialogTitle>
        <DialogDescription className="text-center">
          Acesse sua conta para continuar.
        </DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">Entrar</TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">Cadastrar</TabsTrigger>
        </TabsList>
        
        {/* AQUI ESTÁ O CONTEÚDO QUE FALTAVA */}
        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="email-login-profile">Email</Label>
              <Input id="email-login-profile" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password-login-profile">Senha</Label>
              <Input id="password-login-profile" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-primary">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="username-signup-profile">Username</Label>
              <Input id="username-signup-profile" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-signup-profile">Email</Label>
              <Input id="email-signup-profile" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password-signup-profile">Senha</Label>
              <Input id="password-signup-profile" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-primary">
              {isSubmitting ? "Criando conta..." : "Cadastrar"}
            </Button>
          </form>
        </TabsContent>
        
      </Tabs>
    </DialogContent>
  );
}


// --- COMPONENTE PRINCIPAL DO PERFIL ---
export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate(); 
  
  const [session, setSession] = useState<Session | null>(null);
  //const [currentUser, setCurrentUser] = useState<AuthUser | null>(null); // Este é o usuário do 'auth'
  
  // NOVO: Perfil do usuário LOGADO (da tabela 'User')
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null); 
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [userComments, setUserComments] = useState<UserComment[]>([]);

  // NOVO: Estados de Contagem
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Efeito 1: Ouvir Auth (MODIFICADO para buscar Perfil do Usuário Logado)
  useEffect(() => {
    // 1. Checa a sessão inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      //setCurrentUser(session?.user ?? null); // -> Opcional, talvez não precise mais
      if (session?.user?.email) {
        // Busca o perfil da tabela 'User'
        const { data } = await supabase
          .from('User')
          .select('id, username, Email, avatar_url, bio, is_premium')
          .eq('Email', session.user.email.toLowerCase())
          .single();
        setCurrentUserProfile(data); // Salva o perfil logado
      }
      setIsAuthLoading(false); 
    });

    // 2. Ouve mudanças (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      //setCurrentUser(session?.user ?? null);
      if (session?.user?.email) {
         const { data } = await supabase
          .from('User')
          .select('id, username, Email, avatar_url, bio, is_premium')
          .eq('Email', session.user.email.toLowerCase())
          .single();
        setCurrentUserProfile(data);
      } else {
        // Se fez logout, limpa o perfil
        setCurrentUserProfile(null);
      }
      setIsAuthLoading(false); 
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- NOVAS FUNÇÕES ---
  // Busca as contagens de seguidores/seguindo
  const fetchFollowStats = async (profileId: number) => {
    // 1. Conta quantos SEGUEM este perfil
    const { count: followers } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profileId); // Coluna 'following_id' é o ID do perfil sendo visto

    // 2. Conta quantos este perfil SEGUE
    const { count: following } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileId); // Coluna 'follower_id' é o ID do perfil sendo visto
    
    setFollowerCount(followers ?? 0);
    setFollowingCount(following ?? 0);
  };

  // Verifica se o usuário logado já segue o perfil visitado
  const checkInitialFollow = async (currentUserId: number, profileId: number) => {
    if (currentUserId === profileId) return; // Não pode seguir a si mesmo

    const { data } = await supabase
      .from('user_follows')
      .select('id')
      .match({
        follower_id: currentUserId, // EU
        following_id: profileId,  // ELE
      })
      .single();
    
    setIsFollowing(!!data); // Se data existe (encontrou), 'isFollowing' é true
  };


  // Efeito 2: Buscar Perfil (MODIFICADO para usar 'currentUserProfile')
  useEffect(() => {
    if (isAuthLoading) {
      return; // Espera o Efeito 1 terminar
    }

    async function fetchProfileData() {
      setLoading(true);
      setProfileUser(null);
      setIsOwnProfile(false);
      setIsFollowing(false); // Reseta o estado

      let profileToLoad: UserProfile | null = null;

      if (username) {
        // --- Vendo o perfil de ALGUÉM ---
        const { data, error } = await supabase
          .from('User')
          .select('id, username, Email, avatar_url, bio, is_premium')
          .eq('username', username)
          .single();
        
        if (error || !data) {
          console.error('Usuário não encontrado:', error?.message);
        } else {
          setProfileUser(data);
          profileToLoad = data;
          // Verifica se é o nosso próprio perfil (mesmo vendo por /perfil/meu-username)
          if (currentUserProfile && data.id === currentUserProfile.id) {
            setIsOwnProfile(true);
          }
        }
      } else if (!username && currentUserProfile) {
        // --- Vendo o NOSSO perfil (LOGADO) ---
        setProfileUser(currentUserProfile);
        profileToLoad = currentUserProfile;
        setIsOwnProfile(true);

      } else if (!username && !currentUserProfile) {
        // --- Vendo o NOSSO perfil (NÃO LOGADO) ---
        setIsLoginModalOpen(true);
      }

      // Se carregamos um perfil com sucesso, buscamos os stats
      if (profileToLoad) {
        fetchFollowStats(profileToLoad.id);
        // E verificamos se seguimos ele (apenas se estivermos logados)
        if (currentUserProfile && profileToLoad.id !== currentUserProfile.id) {
          checkInitialFollow(currentUserProfile.id, profileToLoad.id);
        }
      }
      setLoading(false);
    }
    
    fetchProfileData();
  }, [username, currentUserProfile, isAuthLoading, navigate]); // Depende do perfil logado


  // Efeito 3: Buscar os posts (sem mudança)
  useEffect(() => {
    if (!profileUser) return;
    async function fetchUserPosts() {
      const { data, error } = await supabase
        .from('Posts')
        .select('id, carTitle:carTitle, carImage:carImage')
        .eq('user_id', profileUser.id);
      if (error) console.error('Erro ao buscar posts:', error.message);
      else if (data) setUserPosts(data as any);
    }
    fetchUserPosts();
  }, [profileUser]);

  // Efeito 4: Buscar os comentários (sem mudança)
  useEffect(() => {
    if (!profileUser) return;
    async function fetchUserComments() {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`id, body, created_at, post:post_id (id, carTitle)`)
        .eq('user_id', profileUser.id)
        .order('created_at', { ascending: false });
      if (error) console.error('Erro ao buscar comentários:', error.message);
      else if (data) setUserComments(data as any);
    }
    fetchUserComments();
  }, [profileUser]);


  // ... (Função handleLogout - sem mudança) ...
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUserProfile(null); // Limpa o perfil logado
    setProfileUser(null);
    navigate('/'); 
  };

  // --- FUNÇÃO DE SEGUIR/DEIXAR DE SEGUIR ---
  const handleFollowToggle = async () => {
    // 1. Guardas de segurança
    if (!currentUserProfile) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!profileUser || currentUserProfile.id === profileUser.id) {
      return; // Não pode seguir a si mesmo
    }

    // 2. IDs
    const followerId = currentUserProfile.id;
    const followingId = profileUser.id;
    const currentlyFollowing = isFollowing;

    // 3. Atualização Otimista (muda a UI primeiro)
    setIsFollowing(!currentlyFollowing);
    setFollowerCount(count => currentlyFollowing ? count - 1 : count + 1);

    // 4. Lógica de Banco de Dados
    if (currentlyFollowing) {
      // --- DEIXAR DE SEGUIR (DELETE) ---
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .match({
          follower_id: followerId,
          following_id: followingId,
        });
      
      if (error) {
        console.error("Erro ao deixar de seguir:", error.message);
        // Reverte a UI se der erro
        setIsFollowing(currentlyFollowing);
        setFollowerCount(count => count + 1);
      }
    } else {
      // --- SEGUIR (INSERT) ---
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
        });
      
      if (error) {
        console.error("Erro ao seguir:", error.message);
        // Reverte a UI se der erro
        setIsFollowing(currentlyFollowing);
        setFollowerCount(count => count - 1);
      }
    }
  };


  // ... (Renderização Modal de Login, Loading, Usuário não encontrado - sem mudança) ...
  if (isLoginModalOpen) {
    return (
      <Dialog open={isLoginModalOpen} onOpenChange={(open) => {
        setIsLoginModalOpen(open);
        if (!open) navigate('/'); 
      }}>
        <AuthModal onLoginSuccess={(newSession) => {
          setSession(newSession);
          // O Efeito 1 vai cuidar de buscar o perfil
          setIsLoginModalOpen(false);
        }} />
      </Dialog>
    );
  }

  if (isAuthLoading || (loading && !profileUser)) {
     return (
      <div className="min-h-screen bg-background pb-20">
        <Header showBack={!!username} />
        <div className="max-w-lg mx-auto px-4 py-6 text-center">
          Carregando...
        </div>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header showBack={!!username} />
        <div className="max-w-lg mx-auto px-4 py-6 text-center">
          Usuário não encontrado.
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background pb-20">
      <Header showBack={!!username} />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Header (sem mudança) */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <Avatar className="h-32 w-32 border-4 border-primary">
              <AvatarImage src={profileUser.avatar_url} alt={profileUser.username} />
              <AvatarFallback>{profileUser.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            {profileUser.is_premium && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-primary rounded-full p-2">
                <Rocket className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2 text-white">{profileUser.username}</h1>
          
          {/* === STATS ATUALIZADAS (Contagem) === */}
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-xl font-bold">{followerCount}</p>
              <p className="text-sm text-muted-foreground">Seguidores</p>
            </div>
            <div>
              <p className="text-xl font-bold">{followingCount}</p>
              <p className="text-sm text-muted-foreground">Seguindo</p>
            </div>
            <div>
              <p className="text-xl font-bold">{userPosts.length}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
          </div>

          {/* === BOTÕES DE AÇÃO ATUALIZADOS (onClick) === */}
          <div className="flex gap-3 w-full max-w-xs mb-4 items-center">
            {isOwnProfile ? (
              <>
                <Button variant="default" className="flex-1 bg-gradient-primary">
                  Editar Perfil
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleLogout}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleFollowToggle} // <-- ATUALIZADO
                  variant={isFollowing ? "outline" : "default"}
                  className={`flex-1 ${!isFollowing ? 'bg-gradient-primary' : ''}`}
                >
                  {isFollowing ? "Seguindo" : "Seguir"}
                </Button>

              </>
            )}
          </div>

          {/* Premium Badge (sem mudança) */}
          {profileUser.is_premium && (
            <Badge className="bg-gradient-primary mb-4">
              <Rocket className="h-3 w-3 mr-1" />
              GRID Tag Activated
            </Badge>
          )}

          {/* Bio (sem mudança) */}
          <p className="text-sm text-foreground/80">
            {profileUser.bio || "Nenhuma bio."}
          </p>
        </div>

        {/* === TABS ATUALIZADAS (Link do Fórum) === */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">
              <Flame className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="forum" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Fórum
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div 
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)} // <-- CORREÇÃO (usando /post/ e não /posts/)
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  >
                    <img 
                      src={post.carImage} 
                      alt={post.carTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  Nenhum post ainda
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="forum" className="mt-6 space-y-4">
            {userComments.length > 0 ? (
              userComments.map((comment) => (
                <Card key={comment.id} className="bg-card/50">
                  <CardContent className="pt-4">
                    <p className="text-foreground/90 mb-3">{comment.body}</p>
                    {comment.post ? (
                      <Link to={`/post/${comment.post.id}#comment-input`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        em <span className="font-semibold">{comment.post.carTitle}</span>
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">em um post que foi removido</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {new Date(comment.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma atividade no fórum ainda
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavigation />
    </div>
  );
}
