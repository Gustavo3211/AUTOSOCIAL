import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

console.log("[Supabase] Inicializando...")

if (!supabaseUrl || !supabaseKey) {
  console.error("[Supabase] ERRO: Variaveis de ambiente nao configuradas")
  throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
}

console.log("[Supabase] Variaveis OK")

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
     
    },
  },
})

console.log("[Supabase] Cliente criado - pronto para uso")

function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout apos ${timeoutMs}ms`)), timeoutMs)),
  ])
}

export async function retrySupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 2,
  initialDelay = 500,
  timeoutMs = 5000,
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Supabase] Executando query (tentativa ${attempt}/${maxRetries})...`)

      const result = await withTimeout(queryFn(), timeoutMs)

      if (result.error) {
        lastError = result.error
        console.error(`[Supabase] Erro na query:`, result.error.message || result.error)

        // Nao fazer retry em erros de autenticacao ou validacao
        if (result.error.code === "PGRST116" || result.error.code === "401") {
          console.log("[Supabase] Erro de autenticacao ou dados nao encontrados (nao sera feito retry)")
          return result
        }

        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1)
          console.log(`[Supabase] Aguardando ${delay}ms antes de tentar novamente...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
      } else {
        if (attempt > 1) {
          console.log("[Supabase] Conexao restabelecida com sucesso!")
        } else {
          console.log("[Supabase] Query executada com sucesso")
        }
        return result
      }
    } catch (error: any) {
      lastError = error
      console.error(`[Supabase] Excecao capturada:`, error.message || error)

      if (error.message?.includes("Timeout")) {
        console.error("[Supabase] TIMEOUT: A query demorou muito para responder")
        console.log("[Supabase] Dica: Verifique sua conexao com internet ou se o Supabase esta acessivel")
      }

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1)
        console.log(`[Supabase] Tentando novamente em ${delay}ms... (${attempt}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error("[Supabase] FALHA: Todas as tentativas de conexao falharam")
  console.error("[Supabase] Ultimo erro:", lastError?.message || lastError)
  return { data: null, error: lastError }
}

export async function testConnection(timeoutMs = 5000): Promise<boolean> {
  console.log("[Supabase] Iniciando teste de conexao com banco de dados...")

  try {
    console.log("[Supabase] Tentando consultar tabela 'User'...")

    const { data, error } = await withTimeout(supabase.from("User").select("id").limit(1), timeoutMs)

    if (error) {
      console.error("[Supabase] Erro no teste de conexao:", error.message || error)
      console.error("[Supabase] Codigo do erro:", error.code)
      console.error("[Supabase] Detalhes:", error.details || "Nenhum detalhe adicional")

      // Sugestoes baseadas no tipo de erro
      if (error.code === "PGRST116") {
        console.log("[Supabase] Dica: A tabela 'User' pode nao existir ou nao ter dados")
      } else if (error.code === "42P01") {
        console.log("[Supabase] Dica: A tabela 'User' nao existe no banco de dados")
      } else if (error.message.includes("JWT")) {
        console.log("[Supabase] Dica: Problema com autenticacao - verifique a PUBLISHABLE_DEFAULT_KEY")
      }

      return false
    }

    console.log("[Supabase] Teste de conexao bem-sucedido!")
    console.log(
      `[Supabase] Resposta do banco: ${data ? `${data.length} registro(s) encontrado(s)` : "Nenhum dado retornado"}`,
    )
    return true
  } catch (error: any) {
    console.error("[Supabase] EXCECAO durante teste de conexao:", error.message || error)

    if (error.message?.includes("Timeout")) {
      console.error("[Supabase] TIMEOUT: O banco nao respondeu a tempo")
      console.log("[Supabase] Dica: Verifique sua conexao com internet")
      console.log("[Supabase] Dica: Verifique se a URL do Supabase esta correta")
    } else if (error.message?.includes("fetch")) {
      console.log("[Supabase] Dica: Problema de rede - verifique sua conexao com internet")
    } else if (error.message?.includes("CORS")) {
      console.log("[Supabase] Dica: Problema de CORS - verifique as configuracoes do Supabase")
    }

    return false
  }
}

export function queryWithTimeout<T>(promise: Promise<T>, timeoutMs = 3000, queryName = "Query"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        console.error(`[Supabase] Timeout em ${queryName} (${timeoutMs}ms)`)
        reject(new Error(`Timeout: ${queryName} demorou mais de ${timeoutMs}ms`))
      }, timeoutMs),
    ),
  ])
}

export { supabase }
