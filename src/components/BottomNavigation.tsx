"use client"

import type React from "react"

import { Home, Car, PlusCircle, Search, UserRound } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { CreatePostModal } from "./CreatePostModal"
import { supabase, queryWithTimeout } from "@/supabase"

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path?: string
  isCreate?: boolean
}

const navigationItems: NavigationItem[] = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Car, label: "Showroom", path: "/showroom" },
  { icon: PlusCircle, label: "Postar", isCreate: true },
  { icon: Search, label: "Explorar", path: "/search" },
  { icon: UserRound, label: "Perfil", path: "/perfil" },
]

export const BottomNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [localCurrentUserProfileId, setLocalCurrentUserProfileId] = useState<number | null>(null)

  useEffect(() => {
    async function checkAuthAndProfile() {
      try {
        const { data } = await queryWithTimeout(supabase.auth.getSession(), 3000, "getSession")

        if (data?.session?.user?.email) {
          setIsLoggedIn(true)

          try {
            const { data: profile, error } = await queryWithTimeout(
              supabase.from("User").select("id").eq("Email", data.session.user.email.toLowerCase()).maybeSingle(),
              3000,
              "fetchUserProfile",
            )

            if (error) {
              console.error("[BottomNav] Erro ao buscar perfil:", error.message)
            } else if (profile) {
              setLocalCurrentUserProfileId(profile.id)
            } else {
              console.log("[BottomNav] Perfil não encontrado")
            }
          } catch (error) {
            console.error("[BottomNav] Timeout ao buscar perfil:", error)
          }
        } else {
          setIsLoggedIn(false)
          setLocalCurrentUserProfileId(null)
        }
      } catch (error) {
        console.error("[BottomNav] Timeout ao verificar sessao:", error)
        setIsLoggedIn(false)
      }
    }
    checkAuthAndProfile()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        setIsLoggedIn(true)

        try {
          const { data, error } = await queryWithTimeout(
            supabase.from("User").select("id").eq("Email", session.user.email.toLowerCase()).maybeSingle(),
            3000,
            "fetchUserProfile",
          )

          if (error) {
            console.error("[BottomNav] Erro ao buscar perfil:", error.message)
          } else if (data) {
            setLocalCurrentUserProfileId(data.id)
          }
        } catch (error) {
          console.error("[BottomNav] Timeout ao buscar perfil:", error)
        }
      } else {
        setIsLoggedIn(false)
        setLocalCurrentUserProfileId(null)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const handleNavigation = (item: NavigationItem) => {
    if (item.isCreate) {
      if (isLoggedIn) setCreateModalOpen(true)
      else navigate("/perfil")
    } else if (item.path) {
      navigate(item.path)
    }
  }

  return (
    <>
      {/* 🔻 Barra inferior translúcida com reflexo metálico */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-carbon-gray/80 to-carbon-gray/50 backdrop-blur-md border-t border-orange-500/30 shadow-[0_-2px_25px_hsl(25_100%_40%_/_0.25)] z-50">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isActive = item.path === location.pathname
            const isCreate = item.isCreate

            return (
              <button
                key={index}
                onClick={() => handleNavigation(item)}
                className={`relative flex flex-col items-center transition-all duration-300 ${
                  isCreate ? "p-0" : "p-3 rounded-xl"
                } ${isActive ? "text-amber-400" : "text-muted-foreground hover:text-foreground hover:scale-105"}`}
              >
                {isCreate ? (
                  // 🚀 Botão central flutuante com gradiente vermelho-âmbar
                  <div className="relative flex items-center justify-center -mt-7">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-[0_4px_25px_hsl(20_100%_50%_/_0.6)] hover:shadow-[0_0_25px_hsl(20_100%_60%_/_0.8)] hover:scale-110 active:scale-95 transition-all duration-300 border border-amber-300/30">
                      <Icon className="h-7 w-7 text-white drop-shadow-[0_0_6px_hsl(0_0%_100%_/_0.4)]" />
                    </div>
                    <span className="absolute -bottom-6 text-xs text-amber-300 font-medium">Postar</span>
                  </div>
                ) : (
                  <>
                    <Icon
                      className={`h-5 w-5 mb-1 ${
                        isActive ? "text-amber-400 drop-shadow-[0_0_6px_hsl(35_100%_60%_/_0.6)]" : ""
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold tracking-wide ${
                        isActive ? "text-amber-400" : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* 📤 Modal de criação de post */}
      <CreatePostModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        currentUserProfileId={localCurrentUserProfileId}
      />
    </>
  )
}
