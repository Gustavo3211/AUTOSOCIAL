"use client"

import { useState } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BottomNavigation } from "@/components/BottomNavigation"

export default function CarSales() {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("sell")
  const [plateInput, setPlateInput] = useState("")
  const { toast } = useToast()

  const handleGetOffer = () => {
    if (!plateInput) {
      toast({
        title: "Campo obrigatório",
        description: "Digite a placa ou modelo do seu carro",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Oferta em processamento! ⚡",
      description: "Você receberá uma oferta instantânea em breve.",
    })
  }

  const handleAnnounce = () => {
    toast({
      title: "Em breve!",
      description: "A funcionalidade de anunciar carros estará disponível em breve.",
    })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Tab Buttons */}
        <div className="flex gap-3">
          <Button
            variant={activeTab === "buy" ? "outline" : "default"}
            onClick={() => setActiveTab("buy")}
            className={activeTab === "buy" ? "" : "bg-gradient-primary"}
          >
            Comprar Carros
          </Button>
          <Button
            variant={activeTab === "sell" ? "outline" : "default"}
            onClick={() => setActiveTab("sell")}
            className={activeTab === "sell" ? "" : "bg-gradient-primary"}
          >
            Vender Meu Carro
          </Button>
        </div>

        {activeTab === "sell" && (
          <>
            {/* Veron Integration Card */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-background border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center font-bold text-xl">
                  V
                </div>
                <div>
                  <h3 className="font-bold text-lg">Veron</h3>
                  <p className="text-sm text-muted-foreground">Parceiro AutoSocial</p>
                </div>
              </div>

              <h4 className="font-semibold mb-2">Venda rápida e sem burocracia</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Receba uma oferta instantânea pelo seu carro em segundos
              </p>

              <div className="space-y-3">
                <Input
                  placeholder="Digite a placa ou modelo"
                  value={plateInput}
                  onChange={(e) => setPlateInput(e.target.value)}
                />
                <Button onClick={handleGetOffer} className="w-full bg-gradient-primary">
                  Receber oferta instantânea
                </Button>
              </div>
            </Card>

            {/* Announce Button */}
            <Button
              onClick={handleAnnounce}
              variant="outline"
              className="w-full h-auto py-4 border-2 border-primary/50 hover:bg-primary/10 bg-transparent"
            >
              <Plus className="h-5 w-5 mr-2" />
              Anunciar Meu Carro
            </Button>
          </>
        )}

        {/* Cars Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">{activeTab === "buy" ? "Carros Disponíveis" : "Seus Anúncios"}</h2>
          <div className="grid grid-cols-2 gap-4"></div>
        </div>
      </div>
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
