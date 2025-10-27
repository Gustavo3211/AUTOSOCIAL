import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import 'leaflet/dist/leaflet.css';
import Index from "./pages/Index";
import PostDetail from "./pages/PostDetail";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import CarSales from "./pages/CarSales";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark min-h-screen bg-background">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/vender" element={<CarSales />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/perfil/:username" element={<Profile />} />
            <Route path="/perfil" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
