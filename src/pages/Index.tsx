import { HeroSection } from "@/components/HeroSection";
import { CategoryCard } from "@/components/CategoryCard";
import { CarPost } from "@/components/CarPost";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CreatePostModal } from "@/components/CreatePostModal";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { supabase } from "@/superbase";
import { useNavigate } from "react-router-dom";

type Posts = {
  id: number;
  created_at: string;
  description: string;
  like: number;
  comments: number;
  carTitle: string;
  carImage: string;
  carSpecs: string;
  User: { username: string }[] | null;
  Category: { title: string }[] | null;
};

type DbCategory = {
  id: number;
  title: string;
  description: string;
  image: string;
};

const Index = () => {
  const [posts, setPosts] = useState<Posts[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<number | null>(null);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const navigate = useNavigate();

  // --- Auth ---
  useEffect(() => {
    async function getUserProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email) {
        const { data: profile } = await supabase
          .from("User")
          .select("id")
          .eq("Email", session.user.email.toLowerCase())
          .single();
        if (profile) setCurrentUserProfileId(profile.id);
      }
    }
    getUserProfile();
  }, []);

  // --- Buscar posts ---
  useEffect(() => {
    async function fetchPosts() {
      setLoadingPosts(true);
      let query = supabase
        .from("Posts")
        .select("id, created_at, description, like, comments, carTitle, carImage, carSpecs, User(username), Category(title)")
        .order("created_at", { ascending: false });

      if (selectedCategory !== null) query = query.eq("category", selectedCategory);

      const { data, error } = await query;
      if (error) console.error("Erro ao buscar posts:", error.message);
      else if (data) setPosts(data);

      setLoadingPosts(false);
    }
    fetchPosts();
  }, [selectedCategory]);

  // --- Buscar categorias ---
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase.from("Category").select("*");
      if (error) console.error("Erro ao buscar categorias:", error.message);
      else if (data) setDbCategories(data);
    }
    fetchCategories();
  }, []);

  // --- Abrir modal ---
  const handleOpenCreateModal = () => {
    if (currentUserProfileId) setIsCreateModalOpen(true);
    else alert("Você precisa estar logado para postar!");
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
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

        {/* Categories */}
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

        {/* Feed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Feed Principal</h2>
            <button className="text-primary text-sm font-medium">Filtrar</button>
          </div>

          <div className="space-y-6">
            {loadingPosts ? (
              <p className="text-muted-foreground text-center">Carregando feed...</p>
            ) : (
              posts.map((post) => {
                const username = post.User?.[0]?.username || "Usuário";
                const categoryName = post.Category?.[0]?.title || "Sem Categoria";

                return (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/posts/${post.id}`)}
                    className="cursor-pointer hover:opacity-80 transition"
                  >
                    <CarPost
                      id={post.id}
                      username={username}
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
                );
              })
            )}

            {!loadingPosts && posts.length === 0 && (
              <p className="text-muted-foreground text-center py-8">
                Nenhum post encontrado{selectedCategory ? " nesta categoria" : ""}.
              </p>
            )}
          </div>
        </section>
      </div>

      <BottomNavigation />

      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        currentUserProfileId={currentUserProfileId}
      />
    </main>
  );
};

export default Index;
