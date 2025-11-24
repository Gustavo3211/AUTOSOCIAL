"use client"

import { useEffect, useState } from "react"
import { Heart, MessageSquare } from "lucide-react"
import { Header } from "@/components/Header"
import { CategoryCard } from "@/components/CategoryCard"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { BottomNavigation } from "@/components/BottomNavigation"
import { supabase } from "@/supabase"
import { useNavigate } from "react-router-dom"
import { queryWithTimeout } from "@/supabase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type DbCategory = {
  id: number
  title: string
  description: string
  image: string
}

type SearchUser = {
  id: number
  username: string
  avatar_url?: string
  bio?: string
}

type SearchPost = {
  id: number
  carTitle: string
  carImage: string
  like: number
  comments: number
}

export default function Marketplace() {
  const [currentUserProfileId, setCurrentUserProfileId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ users: SearchUser[]; posts: SearchPost[] }>({
    users: [],
    posts: [],
  })
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadInitialData() {
      const results = await Promise.allSettled([
        queryWithTimeout(supabase.auth.getSession(), 3000, "getSession"),
        queryWithTimeout(supabase.from("Category").select("*"), 3000, "fetchCategories"),
      ])

      const sessionResult = results[0]
      if (sessionResult.status === "fulfilled" && sessionResult.value.data?.session?.user?.email) {
        try {
          const { data: profile } = await queryWithTimeout(
            supabase
              .from("User")
              .select("id")
              .eq("Email", sessionResult.value.data.session.user.email.toLowerCase())
              .maybeSingle(),
            3000,
            "fetchUserProfile",
          )
          if (profile) setCurrentUserProfileId(profile.id)
        } catch (error) {
          console.error("[Marketplace] Erro ao buscar perfil:", error)
        }
      }

      const categoriesResult = results[1]
      if (categoriesResult.status === "fulfilled") {
        const { data, error } = categoriesResult.value
        if (data) setDbCategories(data)
        if (error) console.error("[Marketplace] Erro ao buscar categorias:", error.message)
      }
    }
    loadInitialData()
  }, [])

  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      setSearchResults({ users: [], posts: [] })
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const [usersResult, postsResult] = await Promise.allSettled([
        queryWithTimeout(
          supabase.from("User").select("id, username, avatar_url, bio").ilike("username", `%${searchQuery}%`).limit(10),
          5000,
          "searchUsers",
        ),
        queryWithTimeout(
          supabase
            .from("Posts")
            .select("id, carTitle, carImage, like, comments")
            .or(`carTitle.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            .order("created_at", { ascending: false })
            .limit(20),
          5000,
          "searchPosts",
        ),
      ])

      const users = usersResult.status === "fulfilled" && usersResult.value.data ? usersResult.value.data : []
      const posts = postsResult.status === "fulfilled" && postsResult.value.data ? postsResult.value.data : []

      setSearchResults({ users, posts })
    } catch (error) {
      console.error("[Marketplace] Erro ao pesquisar:", error)
      setSearchResults({ users: [], posts: [] })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar posts e usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 text-foreground"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching} className="bg-gradient-primary">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>

        {hasSearched && (
          <div className="space-y-6">
            {searchResults.users.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3">Usuários</h2>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                  {searchResults.users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => navigate(`/perfil/${user.username}`)}
                      className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition min-w-[80px] snap-start"
                    >
                      <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.username} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium text-foreground text-center truncate w-full px-1">
                        {user.username}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.posts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3">Posts</h2>
                <div className="grid grid-cols-3 gap-1">
                  {searchResults.posts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/posts/${post.id}`)}
                      className="relative aspect-square cursor-pointer group overflow-hidden rounded-sm"
                    >
                      <img
                        src={post.carImage || "/placeholder.svg"}
                        alt={post.carTitle}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
  
  {/* Likes */}
  <div className="flex items-center gap-1 text-white">
    <Heart className="w-4 h-4" />
    <span className="text-sm font-bold">{post.like}</span>
  </div>

  {/* Comentários */}
  <div className="flex items-center gap-1 text-white">
    <MessageSquare className="w-4 h-4" />
    <span className="text-sm font-bold">{post.comments}</span>
  </div>

</div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.users.length === 0 && searchResults.posts.length === 0 && !isSearching && (
              <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado para "{searchQuery}"</p>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="grid grid-cols-2 gap-4">
            {dbCategories.length > 0 ? (
              dbCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === category.id ? null : category.id)
                    navigate("/")
                  }}
                  className="cursor-pointer transition-all rounded-xl hover:ring-1 hover:ring-border"
                >
                  <CategoryCard title={category.title} description={category.description} image={category.image} />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground col-span-2">Carregando categorias...</p>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
