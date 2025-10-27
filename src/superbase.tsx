import { createClient } from '@supabase/supabase-js'

// Lê as variáveis do arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria e exporta o cliente
export const supabase = createClient(supabaseUrl, supabaseKey)