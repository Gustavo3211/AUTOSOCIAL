"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Check, Rocket } from "lucide-react"
import { useState, useEffect, type MouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/supabase"
import { queryWithTimeout } from "@/supabase"

interface CarPostProps {
  id: number
  username?: string
  userAvatar?: string
  userId?: number
  isPremium?: boolean
  carImage: string
  carTitle: string
  carSpecs: string
  description: string
  likes: number
  comments: number
  timestamp: string
  category: string
  currentUserProfileId: number | null
}

export const CarPost = ({
  id,
  username: initialUsername,
  userAvatar: initialAvatar,
  userId,
  isPremium = false,
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
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(likes)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState(initialUsername || "")
  const [userAvatar, setUserAvatar] = useState(initialAvatar || "")
  const [isCopied, setIsCopied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkInitialLike() {
      if (!currentUserProfileId) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await queryWithTimeout(
          supabase
            .from("post_likes")
            .select("id", { count: "exact" })
            .match({ post_id: id, user_id: currentUserProfileId })
            .maybeSingle(),
          3000,
          "checkInitialLike",
        )

        if (error) {
          console.log("[CarPost] Erro ao verificar like:", error.message)
          setIsLiked(false)
        } else {
          setIsLiked(!!data)
        }
      } catch (err) {
        console.log("[CarPost] Timeout ou erro ao verificar like:", err instanceof Error ? err.message : err)
        setIsLiked(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkInitialLike()
  }, [id, currentUserProfileId])

  useEffect(() => {
    async function fetchUserInfo() {
      if (initialUsername && initialAvatar) return
      const { data, error } = await supabase
  .from("Posts")
  .select(`
    id,
    carImage,
    carTitle,
    post_likes:post_likes(count),
    post_comments:post_comments(count)
  `)
  .eq("user_id", userId)
        .single()
      if (!error && data?.User) {
        const user = data.User as { username: string; avatar_url?: string }
        setUsername(user.username)
        setUserAvatar(user.avatar_url || "")
      } else {
        console.error("Erro ao buscar usuário do post:", error?.message)
      }
    }
    fetchUserInfo()
  }, [id, initialUsername, initialAvatar])

  const handleLike = async (e: MouseEvent) => {
    e.stopPropagation()
    if (!currentUserProfileId) {
      alert("Você precisa estar logado para curtir!")
      return
    }
    if (isLoading) return

    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1))

    try {
      const { data: newLikeCount, error } = await supabase.rpc("toggle_like", {
        post_id_input: id,
        user_id_input: currentUserProfileId,
      })

      if (error) {
        console.error("[CarPost] Erro ao curtir:", error.message)
        setIsLiked(wasLiked)
        setLikeCount((c) => (wasLiked ? c + 1 : c - 1))
      } else {
        setLikeCount(newLikeCount)
      }
    } catch (err) {
      console.error("[CarPost] Exceção ao curtir:", err)
      setIsLiked(wasLiked)
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1))
    }
  }

  const handleCommentClick = (e: MouseEvent) => {
    e.stopPropagation()
    navigate(`/posts/${id}#comment-input`)
  }

  const handleShareClick = (e: MouseEvent) => {
    e.stopPropagation()
    const postUrl = `${window.location.origin}/posts/${id}`

    navigator.clipboard
      .writeText(postUrl)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Falha ao copiar link: ", err)
        alert("Falha ao copiar link.")
      })
  }

  const handleUsernameClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (username) {
      navigate(`/perfil/${username}`)
    }
  }

  return (
    <Card className="bg-gradient-to-b from-carbon-gray/90 to-carbon-black border border-orange-500/20 shadow-[0_4px_25px_hsl(25_100%_40%_/_0.25)] overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_6px_35px_hsl(25_100%_45%_/_0.35)]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <Avatar
            className="h-10 w-10 border border-amber-400/40 shadow-[0_0_8px_hsl(35_100%_60%_/_0.4)] cursor-pointer"
            onClick={handleUsernameClick}
          >
            {userAvatar ? (
              <AvatarImage src={userAvatar || "/placeholder.svg"} alt={username || "Usuário"} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-orange-600 to-red-600 text-white font-bold">
                {(username ? username.charAt(0) : "?").toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p
                className="font-semibold text-amber-300 drop-shadow-[0_0_6px_hsl(25_100%_50%_/_0.4)] truncate max-w-[150px] cursor-pointer hover:underline"
                onClick={handleUsernameClick}
              >
                {username || "Usuário"}
              </p>
              {isPremium && (
                <Badge className="bg-gradient-to-r from-orange-600 to-amber-500 text-white border-0 text-[10px] px-1.5 py-0">
                  <Rocket className="h-2.5 w-2.5 mr-0.5" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </p>
          </div>
        </div>
      </div>

      <div className="relative group">
        <img
          src={carImage || "/placeholder.svg"}
          alt={carTitle}
          className="w-full h-64 object-cover transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        <div className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full shadow-[0_0_10px_hsl(25_100%_50%_/_0.5)]">
          {category}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-lg font-bold text-white truncate">{carTitle}</h3>
        <p className="text-sm text-amber-300 font-medium truncate">{carSpecs}</p>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLoading}
            className={`transition-all duration-200 ${
              isLiked ? "text-red-500 hover:text-red-600 scale-110" : "text-muted-foreground hover:text-amber-400"
            }`}
          >
            <Heart className={`h-5 w-5 mr-2 transition-transform ${isLiked ? "fill-red-500" : ""}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-amber-400"
            onClick={handleCommentClick}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">{comments}</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-amber-400"
          onClick={handleShareClick}
          disabled={isCopied}
        >
          {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Share2 className="h-5 w-5" />}
        </Button>
      </div>
    </Card>
  )
}
