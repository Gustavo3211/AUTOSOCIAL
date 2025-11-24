"use client"

import { HeroSection } from "@/components/HeroSection"
import { CategoryCard } from "@/components/CategoryCard"
import { CarPost } from "@/components/CarPost"
import { BottomNavigation } from "@/components/BottomNavigation"
import { CreatePostModal } from "@/components/CreatePostModal"
import { useEffect, useState, type MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { X, Loader2, RefreshCw } from "lucide-react"
import { supabase } from "@/supabase"
import { useNavigate } from "react-router-dom"
import { queryWithTimeout } from "@/supabase"

type Posts = {
  id: number
  created_at: string
  description: string
  like: number
  comments: number
  carTitle: string
  carImage: string
  carSpecs: string
  user_id: number
  User: { username: string; is_premium?: boolean; avatar_url?: string }[] | null
  Category: { title: string }[] | null
}

type DbCategory = {
  id: number
  title: string
  description: string
  image: string
}

const Index = () => {
  const [posts, setPosts] = useState<Posts[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [postsError, setPostsError] = useState(false)
  const [currentUserProfileId, setCurrentUserProfileId] = useState<number | null>(null)
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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
          console.error("[Index] Erro ao buscar perfil:", error)
        }
      } else if (sessionResult.status === "rejected") {
        console.error("[Index] Erro ao buscar sessao:", sessionResult.reason)
      }

      const categoriesResult = results[1]
      if (categoriesResult.status === "fulfilled") {
        const { data, error } = categoriesResult.value
        if (data) setDbCategories(data)
        if (error) console.error("[Index] Erro ao buscar categorias:", error.message)
      } else {
        console.error("[Index] Timeout ao buscar categorias:", categoriesResult.reason)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function fetchPosts() {
      setLoadingPosts(true)
      setPostsError(false)

      try {
        let query = supabase
          .from("Posts")
          .select(
            "id, created_at, description, like, comments, carTitle, carImage, carSpecs, user_id, User(username, is_premium, avatar_url), Category(title)",
          )
          .order("User(is_premium)", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20)

        if (selectedCategory !== null) query = query.eq("category", selectedCategory)

        const { data, error } = await queryWithTimeout(query, 5000, "fetchPosts")

        if (error) {
          console.error("[Index] Erro ao buscar posts:", error.message)
          setPostsError(true)
        } else if (data) {
          setPosts(data as Posts[])
        }
      } catch (error) {
        console.error("[Index] Timeout ou erro ao buscar posts:", error)
        setPostsError(true)
      } finally {
        setLoadingPosts(false)
      }
    }
    fetchPosts()
  }, [selectedCategory])

  const handleOpenCreateModal = () => {
    if (currentUserProfileId) setIsCreateModalOpen(true)
    else alert("Você precisa estar logado para postar!")
  }

  const handlePostClick = (e: MouseEvent<HTMLDivElement>, postId: number) => {
    let target = e.target as HTMLElement

    while (target && target !== e.currentTarget) {
      if (target.tagName === "BUTTON" || target.tagName === "A" || target.getAttribute("role") === "button") {
        return
      }
      target = target.parentElement as HTMLElement
    }

    navigate(`/posts/${postId}`)
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">AutoSocial</h1>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Online</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <HeroSection onPostCarClick={handleOpenCreateModal} />

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Categorias</h2>
            {selectedCategory !== null ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar Filtro
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled></Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {dbCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`cursor-pointer transition-all rounded-xl ${
                  selectedCategory === category.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "ring-0 hover:ring-1 hover:ring-border"
                }`}
              >
                <CategoryCard title={category.title} description={category.description} image={category.image} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Feed Principal</h2>
          </div>

          <div className="space-y-6">
            {loadingPosts ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-center">Carregando feed...</p>
              </div>
            ) : postsError ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-muted-foreground text-center">Erro ao carregar posts</p>
                <Button onClick={() => setSelectedCategory(selectedCategory)} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            ) : (
              posts.map((post) => {
                const username = post.User?.[0]?.username || "Usuário"
                const isPremium = post.User?.[0]?.is_premium || false
                const userAvatar = post.User?.[0]?.avatar_url || ""
                let categoryName = "Sem Categoria"

                if (post.Category && Array.isArray(post.Category) && post.Category.length > 0) {
                  categoryName = post.Category[0]?.title || "Sem Categoria"
                } else if (post.Category && !Array.isArray(post.Category)) {
                  categoryName = (post.Category as any).title || "Sem Categoria"
                }

                return (
                  <div
                    key={post.id}
                    onClick={(e) => handlePostClick(e, post.id)}
                    className="cursor-pointer hover:opacity-80 transition"
                  >
                    <CarPost
                      id={post.id}
                      username={username}
                      userAvatar={userAvatar}
                      userId={post.user_id}
                      isPremium={isPremium}
                      carImage={post.carImage}
                      carTitle={post.carTitle}
                      carSpecs={post.carSpecs}
                      description={post.description}
                      likes={post.like}
                      comments={post.comments}
                      timestamp={post.created_at}
                      category={categoryName}
                      currentUserProfileId={currentUserProfileId}
                    />
                  </div>
                )
              })
            )}

            {!loadingPosts && !postsError && posts.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                Nenhum post encontrado{selectedCategory ? " nesta categoria" : ""}.
              </p>
            )}
          </div>
        </section>
      </div>

      <BottomNavigation />

      {isCreateModalOpen && (
        <CreatePostModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          currentUserProfileId={currentUserProfileId}
        />
      )}
    </main>
  )
}

export default Index
