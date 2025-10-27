import { Home, Calendar, Plus, ShoppingBag, User, Search, CarFront } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react"; // Importe useEffect
import { CreatePostModal } from "./CreatePostModal";
import { supabase } from "@/superbase";

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  isCreate?: boolean;
}

const navigationItems: NavigationItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: CarFront, label: "Carros", path: "/eventos" }, //shorts carros 
  { icon: Plus, label: "Criar", isCreate: true },
  { icon: Search, label: "Pesquisar", path: "/marketplace" },// pesquisa
  { icon: User, label: "Perfil", path: "/perfil" }, 
];

// --- REMOVIDO: A prop currentUserProfileId não é mais necessária ---
// interface BottomNavigationProps {
//   currentUserProfileId: number | null;
// }

export const BottomNavigation = () => { // Removido 'currentUserProfileId' das props
  const navigate = useNavigate();
  const location = useLocation();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // --- 2. Novos estados para Auth e ID do Perfil ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [localCurrentUserProfileId, setLocalCurrentUserProfileId] = useState<number | null>(null);

  // --- 3. useEffect para buscar a sessão e o ID do perfil ---
  useEffect(() => {
    async function checkAuthAndProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        // Usuário está logado
        setIsLoggedIn(true);
        // Busca o ID do perfil na tabela "User"
        const { data: profile } = await supabase
          .from('User')
          .select('id')
          .eq('Email', session.user.email.toLowerCase())
          .single();
        if (profile) {
          setLocalCurrentUserProfileId(profile.id);
        } else {
          setLocalCurrentUserProfileId(null); // Perfil não encontrado (Limbo?)
        }
      } else {
        // Usuário não está logado
        setIsLoggedIn(false);
        setLocalCurrentUserProfileId(null);
      }
    }
    checkAuthAndProfile();
    
    // Opcional: Ouvir mudanças no Auth para atualizar em tempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
            setIsLoggedIn(true);
            // Rebuscar o ID se o usuário acabou de logar
             supabase.from('User').select('id').eq('Email', session.user.email.toLowerCase()).single().then(({data}) => {
                if(data) setLocalCurrentUserProfileId(data.id);
             });
        } else {
            setIsLoggedIn(false);
            setLocalCurrentUserProfileId(null);
        }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };

  }, []); // Roda uma vez ao montar

  // --- 4. Modifique a função handleNavigation ---
  const handleNavigation = (item: NavigationItem) => {
    if (item.isCreate) {
      // Verifica o estado local 'isLoggedIn'
      if (isLoggedIn) {
        setCreateModalOpen(true); // Se sim, abre o modal de criar post
      } else {
        navigate("/perfil"); // Se não, navega para /perfil (que abrirá o login)
      }
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.path === location.pathname; 
            const isCreate = item.isCreate;
            
            return (
              <button
                key={index}
                onClick={() => handleNavigation(item)}
                className={`flex flex-col items-center transition-all duration-300 ${
                  isCreate 
                    ? "p-0 -mt-6" 
                    : "p-3 rounded-xl"
                } ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : isCreate ? "text-muted-foreground hover:text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {isCreate ? (
                  <div className="h-14 w-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <>
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- 5. Passe o localCurrentUserProfileId para o CreatePostModal --- */}
      {/* O Modal ainda precisa saber o ID para criar o post */}
      <CreatePostModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        currentUserProfileId={localCurrentUserProfileId} 
      />
    </>
  );
};