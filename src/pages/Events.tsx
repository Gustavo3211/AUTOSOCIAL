import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNavigation } from "@/components/BottomNavigation";
import { supabase } from "@/supabase";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Post {
    id: string;
    carTitle?: string;
    description?: string;
    carImage?: string;
    created_at?: string;
}

export default function DiscoverPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0); 
    const navigate = useNavigate();

    // ... (fetchPosts, useEffect, handlePostClick, handleNext, handlePrev - Lógica de dados e navegação mantida) ...

    const fetchPosts = useCallback(async () => {
        // ... (lógica de fetch) ...
        try {
            const { data, error } = await supabase
                .from("Posts")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Erro ao carregar posts:", error);
            } else {
                setPosts(data || []);
            }
        } catch (err) {
            console.error("Erro inesperado:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handlePostClick = (postId: string) => {
        navigate(`/posts/${postId}`);
    };
    
    // A lógica de navegação handleNext/handlePrev é a mesma, mas agora controlada por botões Up/Down
    const handleNext = () => { 
        setCurrentIndex((prevIndex) => (
            prevIndex === posts.length - 1 ? 0 : prevIndex + 1
        ));
    };

    const handlePrev = () => { 
        setCurrentIndex((prevIndex) => (
            prevIndex === 0 ? posts.length - 1 : prevIndex - 1
        ));
    };

    const currentPost = posts[currentIndex];
    
    // ... (Lógica de Renderização de Status mantida) ...

    if (loading)
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header title="Descubra" />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8 text-primary" />
                </div>
                <BottomNavigation />
            </div>
        );

    if (posts.length === 0)
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Header title="Descubra" />
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-center text-muted-foreground">Nenhum post encontrado.</p>
                </div>
                <BottomNavigation />
            </div>
        );
    // ----------------------------------------

    return (
        <main className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-40 px-4 py-3">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">AutoSocial</h1>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6">
                <div className="space-y-6">
                    {/* Navigation controls (prev/next) */}
                    <div className="flex items-center justify-center space-x-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrev}
                            className="h-10 w-10 rounded-full"
                            disabled={posts.length <= 1}
                        >
                            <ArrowUp className="h-5 w-5" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            className="h-10 w-10 rounded-full"
                            disabled={posts.length <= 1}
                        >
                            <ArrowDown className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Current Post Card */}
                    {currentPost && (
                        <div
                            key={currentPost.id}
                            className="w-full bg-card rounded-lg overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-lg cursor-pointer"
                            onClick={() => handlePostClick(currentPost.id)}
                        >
                            {currentPost.carImage && (
                                <div className="relative w-full aspect-square overflow-hidden">
                                    <img
                                        src={currentPost.carImage}
                                        alt={currentPost.carTitle}
                                        className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                            )}

                            <div className="p-4 bg-card">
                                <h2 className="font-semibold text-xl text-foreground">{currentPost.carTitle || "Sem título"}</h2>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {currentPost.description || "Sem descrição."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Page indicators */}
                    <div className="flex justify-center space-x-1">
                        {posts.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                    index === currentIndex ? 'bg-primary' : 'bg-muted'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <BottomNavigation />
        </main>
    );
}
