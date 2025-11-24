import { createClient } from "@supabase/supabase-js"

console.log("[Supabase Utils] Iniciando configuracao...")

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

// Validacao das variaveis de ambiente
console.log("[Supabase Utils] Verificando variaveis de ambiente...")

if (!supabaseUrl) {
  console.error("[Supabase Utils] ERRO: VITE_SUPABASE_URL nao encontrada!")
  console.error("[Supabase Utils] Adicione VITE_SUPABASE_URL no arquivo .env")
} else {
  console.log(`[Supabase Utils] URL encontrada: ${supabaseUrl.substring(0, 30)}...`)
}

if (!supabaseKey) {
  console.error("[Supabase Utils] ERRO: VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY nao encontrada!")
  console.error("[Supabase Utils] Adicione VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY no arquivo .env")
} else {
  console.log(`[Supabase Utils] Key encontrada: ${supabaseKey.substring(0, 20)}...`)
}

if (!supabaseUrl || !supabaseKey) {
  console.error("[Supabase Utils] FALHA: Configuracao incompleta - cliente nao sera criado")
  throw new Error("Variaveis de ambiente do Supabase nao configuradas")
}

console.log("[Supabase Utils] Criando cliente Supabase...")

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

console.log("[Supabase Utils] Cliente criado com sucesso!")

// Teste de conexao simples
console.log("[Supabase Utils] Testando conexao com banco de dados...")

supabase
  .from("User")
  .select("id")
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error("[Supabase Utils] Erro ao testar conexao:", error.message)
      console.error("[Supabase Utils] Codigo do erro:", error.code)
      console.error("[Supabase Utils] Detalhes:", error.details || "Sem detalhes adicionais")

      // Dicas baseadas no erro
      if (error.code === "PGRST116") {
        console.log("[Supabase Utils] Dica: Tabela User pode estar vazia ou nao existir")
      } else if (error.message.includes("JWT")) {
        console.log("[Supabase Utils] Dica: Problema com a chave de autenticacao")
      } else if (error.message.includes("fetch")) {
        console.log("[Supabase Utils] Dica: Problema de rede - verifique sua internet")
      }
    } else {
      console.log("[Supabase Utils] SUCESSO: Conexao estabelecida!")
      console.log(`[Supabase Utils] Registros encontrados: ${data?.length || 0}`)
    }
  })
  .catch((err) => {
    console.error("[Supabase Utils] EXCECAO ao testar conexao:", err)
    console.error("[Supabase Utils] Tipo:", err.name)
    console.error("[Supabase Utils] Mensagem:", err.message)
  })

export default supabase
