"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { BottomNavigation } from "@/components/BottomNavigation"
import { supabase, queryWithTimeout } from "@/supabase"
import { Loader2, Heart, MessageCircle, Rocket } from "lucide-react"
import { useNavigate } from "react-router-dom"
import useEmblaCarousel from "embla-carousel-react"
import { Badge } from "@/components/ui/badge"

interface Post {
  id: number
  carTitle?: string
  description?: string
  carImage?: string
  carSpecs?: string
  like?: number
  comments?: number
  created_at?: string
  user_id?: number
  User?: { username: string; is_premium?: boolean } | null
  Category?: { title: string } | null
}

export default function Showroom() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [currentUserProfileId, setCurrentUserProfileId] = useState<number | null>(null)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    axis: "y",
    skipSnaps: false,
    containScroll: "trimSnaps",
  })
  const navigate = useNavigate()

  const fetchTodayPosts = useCallback(async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      const { data, error } = await queryWithTimeout(
        supabase
          .from("Posts")
          .select("*, User:user_id(username, is_premium), Category:category(title)")
          .gte("created_at", todayISO)
          .order("User(is_premium)", { ascending: false })
          .order("created_at", { ascending: false }),
        5000,
        "fetchTodayPosts",
      )

      if (error) {
        console.error("[Showroom] Erro ao carregar posts:", error)
        setPosts([])
      } else {
        setPosts(data || [])
      }
    } catch (err) {
      console.log("[Showroom] Timeout ao carregar posts")
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function getUserProfile() {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (session?.user?.email) {
        const { data: profile } = await supabase.from("User").select("id").ilike("Email", session.user.email).single()
        if (profile) setCurrentUserProfileId(profile.id as number)
      }
      setIsAuthLoading(false)
    }
    getUserProfile()
  }, [])

  useEffect(() => {
    if (!currentUserProfileId) return
    async function fetchLikedPosts() {
      const { data, error } = await supabase.from("post_likes").select("post_id").eq("user_id", currentUserProfileId)

      if (data) {
        const ids = data.map((like) => like.post_id)
        setLikedPosts(new Set(ids))
      } else if (error) {
        console.error("[Showroom] Erro ao buscar posts curtidos:", error.message)
      }
    }
    fetchLikedPosts()
  }, [currentUserProfileId])

  useEffect(() => {
    fetchTodayPosts()
  }, [fetchTodayPosts])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap())
    }
    emblaApi.on("select", onSelect)
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  const handlePostClick = (postId: number) => {
    navigate(`/posts/${postId}`)
  }

  const handleUsernameClick = (e: React.MouseEvent, username?: string) => {
    e.stopPropagation()
    if (username) {
      navigate(`/perfil/${username}`)
    }
  }

  if (loading || isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-40 px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">AutoSocial</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-40 px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">AutoSocial</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-4xl font-bold">🎉</p>
            <p className="text-xl font-bold text-foreground">IH VOCÊ VIU TUDO!</p>
            <p className="text-muted-foreground">Nenhum post novo hoje. Volte amanhã!</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const isLastPost = currentIndex === posts.length - 1

  return (
    <main className="min-h-screen bg-background pb-20 overflow-hidden">
      <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">AutoSocial</h1>
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {posts.length}
          </div>
        </div>
      </header>

      <div className="h-[calc(100vh-140px)] overflow-hidden" ref={emblaRef}>
        <div className="flex flex-col h-full">
          {posts.map((post, index) => {
            const username = post.User?.username || "Usuário"
            const isPremium = post.User?.is_premium || false
            const categoryName = post.Category?.title || "Sem Categoria"
            const isLiked = likedPosts.has(post.id)

            return (
              <div key={post.id} className="flex-[0_0_100%] min-h-0 px-4 py-6">
                <div
                  className="h-full w-full max-w-lg mx-auto bg-card rounded-2xl overflow-hidden border shadow-lg cursor-pointer flex flex-col select-none"
                  onClick={() => handlePostClick(post.id)}
                >
                  {post.carImage && (
                    <div className="relative w-full h-[60%] flex-shrink-0 overflow-hidden bg-muted">
                      <img
                        src={post.carImage || "/placeholder.svg"}
                        alt={post.carTitle || "Carro"}
                        className="w-full h-full object-cover"
                        draggable="false"
                      />
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        {isPremium && (
                          <Badge className="bg-gradient-to-r from-orange-600 to-amber-500 text-white border-0">
                            <Rocket className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-xs font-medium text-foreground">{categoryName}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 h-[40%] flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h2 className="font-bold text-2xl text-foreground line-clamp-1 truncate">
                          {post.carTitle || "Sem título"}
                        </h2>
                      </div>

                      <p
                        className="text-sm text-muted-foreground truncate cursor-pointer hover:underline"
                        onClick={(e) => handleUsernameClick(e, username)}
                      >
                        @{username}
                      </p>

                      {post.carSpecs && (
                        <p className="text-sm font-medium text-primary/90 line-clamp-1 pt-1">{post.carSpecs}</p>
                      )}

                      <p className="text-sm text-foreground line-clamp-2 pt-2">{post.description || "Sem descrição"}</p>
                    </div>

                    <div className="flex items-center gap-6 pt-3 border-t">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Heart className={`h-5 w-5 ${isLiked ? "text-red-500 fill-red-500" : ""}`} />
                        <span className="text-sm font-medium">{post.like || 0}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">{post.comments || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {isLastPost && index === currentIndex && (
                  <div className="text-center mt-8 space-y-2">
                    <p className="text-4xl">🎉</p>
                    <p className="text-xl font-bold text-foreground">IH VOCÊ VIU TUDO!</p>
                    <p className="text-sm text-muted-foreground">Volte amanhã para mais posts</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <BottomNavigation />
    </main>
  )
}
