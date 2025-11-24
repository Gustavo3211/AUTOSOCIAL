"use client"

import { useState, useEffect } from "react"
import { testConnection } from "@/supabase"

interface ConnectionStatus {
  isConnected: boolean
  isChecking: boolean
  lastChecked: Date | null
  retryConnection: () => Promise<void>
}

export function useSupabaseConnection(): ConnectionStatus {
  const [isConnected, setIsConnected] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkConnection = async () => {
    console.log("[Hook] 🔍 Verificando status da conexão...")
    setIsChecking(true)

    const connected = await testConnection()

    setIsConnected(connected)
    setLastChecked(new Date())
    setIsChecking(false)

    console.log(
      `[Hook] ${connected ? "✅ Conectado" : "❌ Desconectado"} - Última verificação: ${new Date().toLocaleTimeString()}`,
    )

    return connected
  }

  const retryConnection = async () => {
    console.log("[Hook] 🔄 Tentativa manual de reconexão iniciada...")
    const result = await checkConnection()
    console.log(`[Hook] ${result ? "✅ Reconexão bem-sucedida!" : "❌ Reconexão falhou"}`)
  }

  useEffect(() => {
    console.log("[Hook] 🚀 Inicializando monitoramento de conexão...")

    // Verificar conexão inicial
    checkConnection()

    // Verificar conexão periodicamente (a cada 30 segundos)
    console.log("[Hook] ⏰ Configurando verificação automática a cada 30 segundos...")
    const interval = setInterval(() => {
      console.log("[Hook] ⏰ Verificação periódica de conexão...")
      checkConnection()
    }, 30000)

    // Monitorar mudanças de rede
    const handleOnline = () => {
      console.log("[Hook] 🌐 Conexão de rede restaurada - verificando Supabase...")
      checkConnection()
    }

    const handleOffline = () => {
      console.log("[Hook] 📡 Conexão de rede perdida")
      setIsConnected(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      console.log("[Hook] 🛑 Limpando monitoramento de conexão...")
      clearInterval(interval)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return {
    isConnected,
    isChecking,
    lastChecked,
    retryConnection,
  }
}
