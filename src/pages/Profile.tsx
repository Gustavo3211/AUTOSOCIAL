import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Session, User as AuthUser } from "@supabase/supabase-js";
 

// ... (Imports de UI: Header, Avatar, Button, etc.)
import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Flame, MessageSquare, Bookmark, Rocket } from "lucide-react";
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
import { supabase } from "@/superbase";

// Corrigido: erro de digitação 'superbase'


// ... (Tipos UserProfile e UserPost - sem mudança) ...
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

// --- MODAL DE AUTH (COM CORREÇÃO DE EMAIL) ---
function AuthModal({ onLoginSuccess }: { onLoginSuccess: (session: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); 
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- MUDANÇA 1: Normalizar email no LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(), // <-- Força minúsculas
      password: password,
    });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      onLoginSuccess(data.session);
    }
    setIsSubmitting(false);
  };

  // --- MUDANÇA 2: Normalizar email no CADASTRO ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const normalizedEmail = email.toLowerCase(); // <-- Força minúsculas

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail, // <-- Usa email normalizado
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
        .insert({
          username: username,
          Email: normalizedEmail, // <-- Usa email normalizado
        });

      if (profileError) {
        setError("Cadastro criado, mas falha ao criar perfil: " + profileError.message);
      } else {
        onLoginSuccess(authData.session);
      }
    } else {
      setError("Cadastro realizado! Verifique seu email para logar.");
    }
    setIsSubmitting(false);
  };

  return (
    <DialogContent className="sm:max-w-md">
       {/* ... (O JSX do seu modal não muda nada, só o 'onChange' do email) ... */}
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

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="email-login">Email</Label>
              {/* Note: O 'value' continua sendo 'email', só normalizamos no envio */}
              <Input id="email-login" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {/* ... (resto do form de login) ... */}
            <div className="grid gap-2">
              <Label htmlFor="password-login">Senha</Label>
              <Input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-primary">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4 pt-4">
            {/* ... (form de cadastro) ... */}
            <div className="grid gap-2">
              <Label htmlFor="username-signup">Username</Label>
              <Input id="username-signup" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-signup">Email</Label>
              <Input id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password-signup">Senha</Label>
              <Input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  // --- MUDANÇA 3: Novo estado para "Carregando Auth" ---
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null); 
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Efeito 1: Ouvir Auth (MODIFICADO)
  useEffect(() => {
    // Checa a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setIsAuthLoading(false); // <-- AVISA: "Terminei de checar o auth"
    });

    // Ouve mudanças (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setIsAuthLoading(false); // <-- AVISA: "Terminei de checar o auth"
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Efeito 2: Buscar Perfil (MODIFICADO COM LÓGICA DO LIMBO)
  useEffect(() => {
    // --- "GUARDA" de segurança ---
    if (isAuthLoading) {
      return;
    }

    async function fetchProfileData() {
      setLoading(true);
      setProfileUser(null);
      setIsOwnProfile(false);

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
          // Usa .toLowerCase() aqui também para garantir
          if (currentUser && data.Email.toLowerCase() === currentUser.email?.toLowerCase()) {
            setIsOwnProfile(true);
          }
        }
        
      } else if (!username && currentUser) {
        // --- Vendo o NOSSO perfil (LOGADO) ---
        if (!currentUser.email) {
          console.error("Usuário logado não tem email!");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('User')
          .select('id, username, Email, avatar_url, bio, is_premium')
          .eq('Email', currentUser.email.toLowerCase()) // <-- Força minúsculas
          .single();
        
        if (error || !data) {
          // --- LÓGICA DO LIMBO ---
          console.error('LIMBO DETECTADO: Usuário autenticado, mas perfil "User" não encontrado.');
          // Desconecta automaticamente para resolver o limbo
          await supabase.auth.signOut();
          navigate('/'); // Envia para a home
          // --- FIM DA LÓGICA DO LIMBO ---
        } else {
          // Encontrou o perfil, tudo normal
          setProfileUser(data);
          setIsOwnProfile(true);
        }

      } else if (!username && !currentUser) {
        // --- Vendo o NOSSO perfil (NÃO LOGADO) ---
        // Agora isso só vai rodar DEPOIS que 'isAuthLoading' for false
        // e 'currentUser' for realmente null.
        setIsLoginModalOpen(true);
      }
      setLoading(false);
    }
    
    // Roda a função
    fetchProfileData();
  }, [username, currentUser, isAuthLoading]); // <-- ADICIONADO 'isAuthLoading'

  // Efeito 3: Buscar os posts do perfil (Sem mudança)
  useEffect(() => {
    async function fetchUserPosts() {
      if (!profileUser) return; 

      const { data, error } = await supabase
        .from('Posts')
        .select('id, carTitle:carTitle, carImage:carImage')
        .eq('user_id', profileUser.id);

      if (error) {
        console.error('Erro ao buscar posts:', error.message);
      } else if (data) {
        setUserPosts(data as any);
      }
    }
    
    fetchUserPosts();
  }, [profileUser]);


  // --- NOVA FUNÇÃO DE LOGOUT ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao sair:", error.message);
    } else {
      // Limpa os estados e vai para a home
      setCurrentUser(null);
      setProfileUser(null);
      navigate('/'); 
    }
  };


  // --- Renderização ---
  
  // (A lógica do modal aqui está correta e não muda)
  if (isLoginModalOpen) {
    return (
      <Dialog open={isLoginModalOpen} onOpenChange={(open) => {
        setIsLoginModalOpen(open);
        if (!open) navigate('/'); 
      }}>
        <AuthModal onLoginSuccess={(newSession) => {
          setSession(newSession);
          setCurrentUser(newSession.user);
          setIsLoginModalOpen(false);
        }} />
      </Dialog>
    );
  }

  // --- MUDANÇA 5: Novo estado de loading para o Auth ---
  // Se 'isAuthLoading' for true, OU se 'loading' (o fetch do perfil) for true
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
  
  // (O resto do seu JSX de perfil não muda nada)
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

  // O resto do seu return (perfil, stats, tabs...)
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header showBack={!!username} />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Header */}
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

          <h1 className="text-2xl font-bold mb-2">{profileUser.username}</h1>
          
          {/* Stats */}
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Seguidores</p>
            </div>
            <div>
              <p className="text-xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Seguindo</p>
            </div>
            <div>
              <p className="text-xl font-bold">{userPosts.length}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
          </div>

          {/* --- BOTÕES DE AÇÃO ATUALIZADOS --- */}
          <div className="flex gap-3 w-full max-w-xs mb-4">
            {isOwnProfile ? (
              <>
                <Button variant="outline" className="flex-1">
                  Editar Perfil
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" // 'sm' (small) deixa o botão menor
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => {
                    if (!currentUser) {
                      setIsLoginModalOpen(true);
                    } else {
                      setIsFollowing(!isFollowing);
                    }
                  }}
                  variant={isFollowing ? "outline" : "default"}
                  className={`flex-1 ${!isFollowing ? 'bg-gradient-primary' : ''}`}
                >
                  {isFollowing ? "Seguindo" : "Seguir"}
                </Button>
                <Button variant="outline" className="flex-1">
                  Mensagem
                </Button>
              </>
            )}
          </div>
          {/* --- FIM DA MUDANÇA --- */}


          {/* Premium Badge */}
          {profileUser.is_premium && (
            <Badge className="bg-gradient-primary mb-4">
              <Rocket className="h-3 w-3 mr-1" />
              GRID Tag Activated
            </Badge>
          )}

          {/* Bio */}
          <p className="text-sm text-foreground/80">
            {profileUser.bio || "Nenhuma bio."}
          </p>
        </div>

        {/* Tabs */}
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
            {isOwnProfile && (
              <TabsTrigger value="saved" className="flex-1">
                <Bookmark className="h-4 w-4 mr-2" />
                Salvos
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div 
                    key={post.id}
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

          <TabsContent value="forum" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma discussão no fórum ainda
            </div>
          </TabsContent>
          
          {isOwnProfile && (
            <TabsContent value="saved" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Nenhum post salvo ainda
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <BottomNavigation />
    </div>
  );
}