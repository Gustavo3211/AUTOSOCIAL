import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { lazy, Suspense } from "react"
import { UserProvider } from "@/contexts/UserContext"
import "leaflet/dist/leaflet.css"

const Index = lazy(() => import("./pages/Index"))
const PostDetail = lazy(() => import("./pages/PostDetail"))
const Showroom = lazy(() => import("./pages/Showroom"))
const Search = lazy(() => import("./pages/Marketplace"))
const CarSales = lazy(() => import("./pages/CarSales"))
const Premium = lazy(() => import("./pages/Premium"))
const Profile = lazy(() => import("./pages/Profile"))
const NotFound = lazy(() => import("./pages/NotFound"))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-muted-foreground">Carregando...</div>
  </div>
)

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <div className="dark min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/posts/:id" element={<PostDetail />} />
                <Route path="/showroom" element={<Showroom />} />
                <Route path="/search" element={<Search />} />
                <Route path="/marketplace" element={<Search />} />
                <Route path="/eventos" element={<Showroom />} />
                <Route path="/vender" element={<CarSales />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/perfil/:username" element={<Profile />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
)

export default App
