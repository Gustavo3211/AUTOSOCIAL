"use client"

import { useSupabaseConnection } from "@/hooks/useSupabaseConnection"
import { WifiOff, RefreshCw } from "lucide-react"

export function ConnectionStatus() {
  const { isConnected, isChecking, retryConnection } = useSupabaseConnection()

  // Não mostrar nada se estiver conectado
  if (isConnected && !isChecking) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div
        className={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
          isChecking ? "bg-yellow-50 border border-yellow-200" : "bg-red-50 border border-red-200"
        }`}
      >
        {isChecking ? (
          <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
        ) : (
          <WifiOff className="w-5 h-5 text-red-600" />
        )}

        <div className="flex-1">
          <p className={`text-sm font-medium ${isChecking ? "text-yellow-800" : "text-red-800"}`}>
            {isChecking ? "Verificando conexão..." : "Sem conexão"}
          </p>
          <p className={`text-xs ${isChecking ? "text-yellow-600" : "text-red-600"}`}>
            {isChecking ? "Aguarde um momento" : "Verifique sua internet"}
          </p>
        </div>

        {!isChecking && (
          <button
            onClick={retryConnection}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}
