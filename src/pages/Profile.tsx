"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"

import { Header } from "@/components/Header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Heart, Flame, MessageSquare, Rocket, LogOut } from "lucide-react"
import { BottomNavigation } from "@/components/BottomNavigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { supabase, queryWithTimeout } from "@/supabase"
import { ProfileEditModal } from "@/components/ProfileEditModal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

type UserProfile = {
  id: number
  username: string
  Email: string
  avatar_url?: string
  bio?: string
  is_premium?: boolean
}

type UserPost = {
  id: number
  carImage: string
  carTitle: string
  likes: number 
  comments: number
}

type UserComment = {
  id: number
  body: string
  created_at: string
  post: {
    id: number
    carTitle: string
  } | null
}

// -----------------------------------------------------------------
// AUTH MODAL
// -----------------------------------------------------------------

function AuthModal({ onLoginSuccess }: { onLoginSuccess: (session: Session) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [signupSuccess, setSignupSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    })
    if (error) setError(error.message)
    else if (data.session) onLoginSuccess(data.session)
    setIsSubmitting(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSignupSuccess(false)

    const normalizedEmail = email.toLowerCase()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password,
      options: {
        data: {
          username: username,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setIsSubmitting(false)
      return
    }

    if (authData.user) {
      setSignupSuccess(true)
      setEmail("")
      setPassword("")
      setUsername("")

      setTimeout(() => {
        setActiveTab("login")
        setSignupSuccess(false)
      }, 2000)
    }

    setIsSubmitting(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-center text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          AutoSocial
        </DialogTitle>
        <DialogDescription className="text-center">Acesse sua conta para continuar.</DialogDescription>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">
            Entrar
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">
            Cadastrar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="email-login-profile">Email</Label>
              <Input
                id="email-login-profile"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password-login-profile">Senha</Label>
              <Input
                id="password-login-profile"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-primary">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          {signupSuccess && (
            <Alert className="mb-4 border-green-500 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Cadastro realizado! Agora faça login na sua conta.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignUp} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="username-signup-profile">Username</Label>
              <Input
                id="username-signup-profile"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={signupSuccess}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email-signup-profile">Email</Label>
              <Input
                id="email-signup-profile"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={signupSuccess}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password-signup-profile">Senha</Label>
              <Input
                id="password-signup-profile"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={signupSuccess}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={isSubmitting || signupSuccess} className="w-full bg-gradient-primary">
              {isSubmitting ? "Criando conta..." : "Cadastrar"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </DialogContent>
  )
}

// --- COMPONENTE PRINCIPAL DO PERFIL ---
export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState<Session | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<UserPost[]>([])
  const [userComments, setUserComments] = useState<UserComment[]>([])

  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Efeito 1: Ouvir Auth
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user?.email) {
        try {
          const { data, error } = await queryWithTimeout(
            supabase
              .from("User")
              .select("id, username, Email, avatar_url, bio, is_premium")
              .eq("Email", session.user.email.toLowerCase())
              .maybeSingle(),
          )

          if (error) {
            if (error.code === "PGRST116" || error.message?.includes("406")) {
              console.log("[Profile] Perfil não encontrado ou sem permissão")
            } else {
              console.error("[Profile] Erro ao buscar perfil:", error.message)
            }
          } else {
            setCurrentUserProfile(data)
          }
        } catch (err) {
          console.log("[Profile] Timeout ao buscar perfil do usuário logado")
        }
      }
      setIsAuthLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user?.email) {
        try {
          const { data, error } = await queryWithTimeout(
            supabase
              .from("User")
              .select("id, username, Email, avatar_url, bio, is_premium")
              .eq("Email", session.user.email.toLowerCase())
              .maybeSingle(),
          )

          if (error) {
            if (error.code === "PGRST116" || error.message?.includes("406")) {
              console.log("[Profile] Perfil não encontrado ou sem permissão")
            } else {
              console.error("[Profile] Erro ao buscar perfil:", error.message)
            }
          } else {
            setCurrentUserProfile(data)
          }
        } catch (err) {
          console.log("[Profile] Timeout ao buscar perfil")
        }
      } else {
        setCurrentUserProfile(null)
      }
      setIsAuthLoading(false)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // Busca as contagens de seguidores/seguindo
  const fetchFollowStats = async (profileId: number) => {
    try {
      const [followersResult, followingResult] = await Promise.allSettled([
        queryWithTimeout(
          supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
        ),
        queryWithTimeout(
          supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
        ),
      ])

      const followers = followersResult.status === "fulfilled" ? followersResult.value.count : 0
      const following = followingResult.status === "fulfilled" ? followingResult.value.count : 0

      setFollowerCount(followers ?? 0)
      setFollowingCount(following ?? 0)
    } catch (err) {
      console.log("[Profile] Erro ao buscar estatísticas de seguidores")
      setFollowerCount(0)
      setFollowingCount(0)
    }
  }

  // Verifica se o usuário logado já segue o perfil visitado
  const checkInitialFollow = async (currentUserId: number, profileId: number) => {
    if (currentUserId === profileId) return

    try {
      const { data, error } = await queryWithTimeout(
        supabase
          .from("user_follows")
          .select("id")
          .match({
            follower_id: currentUserId,
            following_id: profileId,
          })
          .maybeSingle(),
      )

      if (error && error.code !== "PGRST116" && !error.message?.includes("406")) {
        console.error("[Profile] Erro ao verificar follow:", error.message)
      }

      setIsFollowing(!!data)
    } catch (err) {
      console.log("[Profile] Timeout ao verificar follow")
      setIsFollowing(false)
    }
  }

  const refreshProfileData = async () => {
    if (!currentUserProfile) return

    try {
      const { data, error } = await queryWithTimeout(
        supabase
          .from("User")
          .select("id, username, Email, avatar_url, bio, is_premium")
          .eq("id", currentUserProfile.id)
          .maybeSingle(),
      )

      if (!error && data) {
        setCurrentUserProfile(data)
        if (isOwnProfile) {
          setProfileUser(data)
        }
      }
    } catch (err) {
      console.log("[Profile] Erro ao atualizar perfil")
    }
  }

  // Efeito 2: Buscar Perfil
  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    async function fetchProfileData() {
      setLoading(true)
      setProfileUser(null)
      setIsOwnProfile(false)
      setIsFollowing(false)

      let profileToLoad: UserProfile | null = null

      if (username) {
        try {
          const { data, error } = await queryWithTimeout(
            supabase
              .from("User")
              .select("id, username, Email, avatar_url, bio, is_premium")
              .eq("username", username)
              .maybeSingle(),
          )

          if (error) {
            if (error.code === "PGRST116" || error.message?.includes("406")) {
              console.log("[Profile] Usuário não encontrado")
            } else {
              console.error("[Profile] Erro ao buscar usuário:", error.message)
            }
          } else if (data) {
            setProfileUser(data)
            profileToLoad = data
            if (currentUserProfile && data.id === currentUserProfile.id) {
              setIsOwnProfile(true)
            }
          }
        } catch (err) {
          console.log("[Profile] Timeout ao buscar perfil do usuário")
        }
      } else if (!username && currentUserProfile) {
        setProfileUser(currentUserProfile)
        profileToLoad = currentUserProfile
        setIsOwnProfile(true)
      } else if (!username && !currentUserProfile) {
        setIsLoginModalOpen(true)
      }

      if (profileToLoad) {
        fetchFollowStats(profileToLoad.id)
        if (currentUserProfile && profileToLoad.id !== currentUserProfile.id) {
          checkInitialFollow(currentUserProfile.id, profileToLoad.id)
        }
      }
      setLoading(false)
    }

    fetchProfileData()
  }, [username, currentUserProfile, isAuthLoading, navigate])

  // Efeito 3: Buscar os posts (CORRIGIDO ORDEM)
  useEffect(() => {
    if (!profileUser) return
    async function fetchUserPosts() {
      try {
        const { data, error } = await queryWithTimeout(
          supabase
            .from("Posts")
            // CORREÇÃO APLICADA AQUI: Renomeando 'like' para 'likes' no frontend
            .select(`id, carTitle, carImage, likes:like, comments`)
            .eq("user_id", profileUser.id)
            .order("created_at", { ascending: false }),
        )

        if (error) {
          if (error.code === "PGRST116" || error.message?.includes("406")) {
            console.log("[Profile] Posts não encontrados ou sem permissão")
          } else {
            console.error("[Profile] Erro ao buscar posts:", error.message)
          }
          setUserPosts([])
        } else if (data) {
          setUserPosts(data as UserPost[])
        }
      } catch (err) {
        console.log("[Profile] Timeout ao buscar posts")
        setUserPosts([])
      }
    }
    fetchUserPosts()
  }, [profileUser])

  // Efeito 4: Buscar os comentários
  useEffect(() => {
    if (!profileUser) return
    async function fetchUserComments() {
      try {
        const { data, error } = await queryWithTimeout(
          supabase
            .from("post_comments")
            .select(`id, body, created_at, post:post_id (id, carTitle)`)
            .eq("user_id", profileUser.id)
            .order("created_at", { ascending: false }),
        )

        if (error) {
          if (error.code === "PGRST116" || error.message?.includes("406")) {
            console.log("[Profile] Comentários não encontrados ou sem permissão")
          } else {
            console.error("[Profile] Erro ao buscar comentários:", error.message)
          }
          setUserComments([])
        } else if (data) {
          setUserComments(data as UserComment[])
        }
      } catch (err) {
        console.log("[Profile] Timeout ao buscar comentários")
        setUserComments([])
      }
    }
    fetchUserComments()
  }, [profileUser])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentUserProfile(null)
    setProfileUser(null)
    navigate("/")
  }

  const handleFollowToggle = async () => {
    if (!currentUserProfile) {
      setIsLoginModalOpen(true)
      return
    }
    if (!profileUser || currentUserProfile.id === profileUser.id) {
      return
    }

    const followerId = currentUserProfile.id
    const followingId = profileUser.id
    const currentlyFollowing = isFollowing

    setIsFollowing(!currentlyFollowing)
    setFollowerCount((count) => (currentlyFollowing ? count - 1 : count + 1))

    try {
      if (currentlyFollowing) {
        const { error } = await queryWithTimeout(
          supabase.from("user_follows").delete().match({
            follower_id: followerId,
            following_id: followingId,
          }),
        )

        if (error) {
          console.error("[Profile] Erro ao deixar de seguir:", error.message)
          setIsFollowing(currentlyFollowing)
          setFollowerCount((count) => count + 1)
        }
      } else {
        const { error } = await queryWithTimeout(
          supabase.from("user_follows").insert({
            follower_id: followerId,
            following_id: followingId,
          }),
        )

        if (error) {
          console.error("[Profile] Erro ao seguir:", error.message)
          setIsFollowing(currentlyFollowing)
          setFollowerCount((count) => count - 1)
        }
      }
    } catch (err) {
      console.log("[Profile] Timeout ao atualizar follow")
      setIsFollowing(currentlyFollowing)
      setFollowerCount((count) => (currentlyFollowing ? count + 1 : count - 1))
    }
  }

  if (isLoginModalOpen) {
    return (
      <Dialog
        open={isLoginModalOpen}
        onOpenChange={(open) => {
          setIsLoginModalOpen(open)
          if (!open) navigate("/")
        }}
      >
        <AuthModal
          onLoginSuccess={(newSession) => {
            setSession(newSession)
            setIsLoginModalOpen(false)
          }}
        />
      </Dialog>
    )
  }

  if (isAuthLoading || (loading && !profileUser)) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header showBack={!!username} />
        <div className="max-w-lg mx-auto px-4 py-6 text-center">Carregando...</div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header showBack={!!username} />
        <div className="max-w-lg mx-auto px-4 py-6 text-center">Usuário não encontrado.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header showBack={!!username} />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <Avatar className="h-32 w-32 border-4 border-primary">
              <AvatarImage src={profileUser.avatar_url || "/placeholder.svg"} alt={profileUser.username} />
              <AvatarFallback>{profileUser.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            {profileUser.is_premium && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-primary rounded-full p-2">
                <Rocket className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">{profileUser.username}</h1>

          {/* STATS */}
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-xl font-bold text-foreground">{followerCount}</p>
              <p className="text-sm text-muted-foreground">Seguidores</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{followingCount}</p>
              <p className="text-sm text-muted-foreground">Seguindo</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{userPosts.length}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex gap-3 w-full max-w-xs mb-4 items-center">
            {isOwnProfile ? (
              <>
                <Button
                  variant="default"
                  className="flex-1 bg-gradient-primary"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Editar Perfil
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLogout}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing ? "outline" : "default"}
                  className={`flex-1 ${!isFollowing ? "bg-gradient-primary" : ""}`}
                >
                  {isFollowing ? "Seguindo" : "Seguir"}
                </Button>
              </>
            )}
          </div>

          {/* Premium Badge */}
          {profileUser.is_premium && (
            <Badge className="bg-gradient-primary mb-4">
              <Rocket className="h-3 w-3 mr-1" />
              GRID Tag Activated
            </Badge>
          )}

          {/* Bio */}
          <p className="text-sm text-foreground/80 line-clamp-3">{profileUser.bio || "Nenhuma bio."}</p>
        </div>

        {/* TABS */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">
              <Flame className="h-4 w-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="forum" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div
  key={post.id}
  onClick={() => navigate(`/posts/${post.id}`)}
  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
>
  {/* IMAGEM (zoom no hover já existente) */}
  <img
    src={post.carImage || "/placeholder.svg"}
    alt={post.carTitle}
    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
  />

  {/* SEU GRADIENTE (mantive, com opacidade mais baixa para combinar com overlay) */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />

  {/* OVERLAY COM OS ÍCONES E NÚMEROS */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 pointer-events-none">
    {/* Likes */}
    <div className="flex items-center gap-2 text-white text-sm font-semibold pointer-events-auto">
      <Heart className="w-4 h-4" />
      <span>{post.likes ?? 0}</span>
    </div>

    {/* Comentários */}
    <div className="flex items-center gap-2 text-white text-sm font-semibold pointer-events-auto">
      <MessageSquare className="w-4 h-4" />
      <span>{post.comments ?? 0}</span>
    </div>
  </div>
</div>
                  
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-muted-foreground">Nenhum post ainda</div>
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
                      <Link
                        to={`/posts/${comment.post.id}#comment-input`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        em <span className="font-semibold">{comment.post.carTitle}</span>
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">em um post que foi removido</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {new Date(comment.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">Nenhuma atividade no fórum ainda</div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />

      {isOwnProfile && currentUserProfile && (
        <ProfileEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          currentProfile={currentUserProfile}
          onProfileUpdated={refreshProfileData}
        />
      )}
    </div>
  )
}