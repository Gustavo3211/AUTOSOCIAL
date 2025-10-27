import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import { CarPost } from "@/components/CarPost";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { supabase } from "@/supabase";
import { useNavigate } from "react-router-dom";

type DbCategory = {
  id: number;
  title: string;
  description: string;
  image: string;
};

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


export default function Marketplace() {
  const [currentUserProfileId, setCurrentUserProfileId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Posts[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadInitialData() {
      const [sessionResult, categoriesResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from("Category").select("*")
      ]);

      if (sessionResult.data?.session?.user?.email) {
        const { data: profile } = await supabase
          .from("User")
          .select("id")
          .eq("Email", sessionResult.data.session.user.email.toLowerCase())
          .single();
        if (profile) setCurrentUserProfileId(profile.id);
      }

      if (categoriesResult.data) setDbCategories(categoriesResult.data);
      if (categoriesResult.error) console.error("Erro ao buscar categorias:", categoriesResult.error.message);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      setLoadingPosts(true);

      let query = supabase
        .from("Posts")
        .select(
          "id, created_at, description, like, comments, carTitle, carImage, carSpecs, User(username), Category(title)"
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (selectedCategory !== null) query = query.eq("category", selectedCategory);

      if (searchQuery.trim() !== "")
        query = query.or(
          `carTitle.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar posts:", error.message);
      } else if (data) {
        setPosts(data);
      }

      setLoadingPosts(false);
    }

    fetchPosts();
  }, [selectedCategory, searchQuery]);


  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 🔍 Barra de Pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar posts e usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-foreground"
          />
        </div>

        {/* 🏷️ Categorias */}
        <div className="grid grid-cols-2 gap-4">
          {dbCategories.length > 0 ? (
            dbCategories.map((category) => (
              <div
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )
                }
                className={`cursor-pointer transition-all rounded-xl ${
                  selectedCategory === category.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "ring-0 hover:ring-1 hover:ring-border"
                }`}
              >
                <CategoryCard
                  title={category.title}
                  description={category.description}
                  image={category.image}
                />
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              Carregando categorias...
            </p>
          )}
        </div>

        {/* 🧱 Posts */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-4">
            Posts:
          </h2>

          {loadingPosts ? (
            <p className="text-center text-muted-foreground">
              Carregando posts...
            </p>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhum post encontrado.
            </p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
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
              })}
            </div>
          )}
        </div>
      </div>

      {/* 🧭 Navegação Inferior */}
      <BottomNavigation />
    </div>
  );
}
