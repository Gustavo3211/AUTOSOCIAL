import { useState } from "react";
import { Header } from "@/components/Header";
// import { EventCard } from "@/components/EventCard"; // (Você não usou, mas mantive)
// import { FloatingActionButton } from "@/components/FloatingActionButton"; // (Você não usou, mas mantive)
import { FilterChips } from "@/components/FilterChips";
import { Plus, MapPin } from "lucide-react"; // (MapPin não é mais usado aqui)
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";

// --- Importações do Mapa ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// --- CORREÇÃO DO ÍCONE PADRÃO DO LEAFLET ---
// (Sem isso, os 'pins' do mapa não aparecem)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41], // Ponto correto do ícone
    popupAnchor: [1, -34] // Ponto correto do popup
});

L.Marker.prototype.options.icon = DefaultIcon;
// --- Fim da Correção ---


const filterChips = [
  { id: "all", label: "Todos" },
  { id: "encontro", label: "Encontro" },
  { id: "oficinas", label: "Oficinas" }
];

export default function Events() {
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();

  const handleCreateEvent = () => {
    toast({
      title: "Em breve!",
      description: "A funcionalidade de criar eventos estará disponível em breve."
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <h1 className="text-3xl font-bold">Mapa de Eventos</h1>

        {/* Filters */}
        <FilterChips 
          chips={filterChips}
          activeChip={activeFilter}
          onChipClick={setActiveFilter}
        />

        {/* --- MAPA DE VERDADE --- */}
        {/* Container do Mapa (substitui sua div 'relative') */}
        <div className="h-[50vh] rounded-xl overflow-hidden border border-border">
          <MapContainer 
            // Eu peguei as coordenadas de Campina Grande (sua localização)
            // Mude 'center' para onde você quiser que o mapa comece
            center={[-7.230, -35.881]} 
            zoom={13} // Nível de zoom
            style={{ height: "100%", width: "100%" }}
          >
            {/* Camada de "azulejos" do mapa (a imagem do mapa) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Marcadores de Exemplo (no futuro, virão do Supabase) */}
            <Marker position={[-7.22, -35.88]}>
              <Popup>
                Encontro de Tunados no Açude Velho.
              </Popup>
            </Marker>
            
            <Marker position={[-7.23, -35.89]}>
              <Popup>
                Oficina do Zé.
              </Popup>
            </Marker>

          </MapContainer>
        </div>
        {/* --- FIM DO MAPA --- */}


        {/* Quick Selection */}
        <div>
          <h2 className="text-xl font-bold mb-4">Seleção Rápida de Eventos</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Você pode popular isso com <EventCard /> no futuro */}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}