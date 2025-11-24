"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase, queryWithTimeout } from "@/supabase"
import type { Session } from "@supabase/supabase-js"

interface UserProfile {
  id: number
  username: string
  Email: string
  avatar_url?: string
  bio?: string
  is_premium?: boolean
}

interface UserContextType {
  session: Session | null
  currentUserProfile: UserProfile | null
  isAuthLoading: boolean
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  const fetchUserProfile = async (email: string) => {
    try {
      const { data, error } = await queryWithTimeout(
        supabase
          .from("User")
          .select("id, username, Email, avatar_url, bio, is_premium")
          .eq("Email", email)
          .maybeSingle(),
        3000,
        "fetchUserProfile",
      )

      if (error) {
        console.error("[UserContext] Erro ao buscar perfil:", error.message)
        return null
      }

      if (!data) {
        console.log("[UserContext] Perfil nao encontrado para:", email)
        return null
      }

      console.log("[UserContext] Perfil carregado")
      return data as UserProfile | null
    } catch (error) {
      console.error("[UserContext] Falha ao carregar perfil:", error)
      return null
    }
  }

  const refreshProfile = async () => {
    try {
      const { data, error } = await queryWithTimeout(supabase.auth.getSession(), 3000, "getSession")

      if (error) {
        console.error("[UserContext] Erro ao obter sessão")
        return
      }

      if (data?.session?.user?.email) {
        const profile = await fetchUserProfile(data.session.user.email)
        setCurrentUserProfile(profile)
      }
    } catch (error) {
      console.error("[UserContext] Erro ao atualizar perfil")
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await queryWithTimeout(supabase.auth.getSession(), 3000, "initAuth")

        if (error) {
          console.error("[UserContext] Erro ao inicializar auth")
          setIsAuthLoading(false)
          return
        }

        setSession(data?.session || null)

        if (data?.session?.user?.email) {
          const profile = await fetchUserProfile(data.session.user.email)
          setCurrentUserProfile(profile)
        }

        setIsAuthLoading(false)
      } catch (error) {
        console.error("[UserContext] Falha na inicializacao")
        setIsAuthLoading(false)
      }
    }

    initializeAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      try {
        setSession(newSession)

        if (newSession?.user?.email) {
          const profile = await fetchUserProfile(newSession.user.email)
          setCurrentUserProfile(profile)
        } else {
          setCurrentUserProfile(null)
        }

        setIsAuthLoading(false)
      } catch (error) {
        console.error("[UserContext] Erro ao processar mudanca de auth")
        setIsAuthLoading(false)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider value={{ session, currentUserProfile, isAuthLoading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
