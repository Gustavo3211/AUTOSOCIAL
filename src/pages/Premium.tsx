import { Header } from "@/components/Header";
import { SpecsList } from "@/components/SpecsList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";

const benefits = [
  "Kit físico premium (adesivo NFC-QR)",
  "Perfil e posts verificados com selo exclusivo",
  "Destaque no Feed e buscas prioritárias",
  "Crachá digital exclusivo GRID Tag",
  "Análises detalhadas de visualizações",
  "Suporte prioritário 24/7"
];

export default function Premium() {
  const { toast } = useToast();

  const handlePurchase = () => {
    toast({
      title: "Em breve!",
      description: "O GRID Tag Premium estará disponível em breve."
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header showBack title="GRID Tag Premium" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero Image */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800" 
            alt="GRID Tag Premium"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="text-white font-bold text-lg">GRID Tag</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Transforme seu carro em um ícone digital
          </h1>
          <p className="text-muted-foreground">
            Conecte o mundo físico ao digital com tecnologia NFC e QR Code
          </p>
        </div>

        {/* Benefits Card */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Benefícios Exclusivos</h2>
          <SpecsList specs={benefits} />
        </Card>

        {/* Features */}
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-card rounded-lg">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Kit Físico Premium</h3>
              <p className="text-sm text-muted-foreground">
                Adesivo resistente com NFC e QR Code para colocar no seu carro
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-card rounded-lg">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Verificação Digital</h3>
              <p className="text-sm text-muted-foreground">
                Selo verificado em todos os seus posts e perfil
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-card rounded-lg">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Visibilidade Máxima</h3>
              <p className="text-sm text-muted-foreground">
                Seus posts aparecem em destaque no feed principal
              </p>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-background border-primary/20">
          <p className="text-sm text-muted-foreground mb-2">Investimento único</p>
          <p className="text-4xl font-bold text-primary mb-2">R$ 99,90</p>
          <p className="text-sm text-muted-foreground">+ frete para sua região</p>
        </Card>
      </div>

      {/* Purchase Button */}
      <div className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handlePurchase}
            className="w-full h-14 bg-gradient-primary text-lg font-semibold"
          >
            <Rocket className="h-5 w-5 mr-2" />
            Comprar GRID Tag - R$ 99,90
          </Button>
        </div>
      </div>
            {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
