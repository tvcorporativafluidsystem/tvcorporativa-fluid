// src/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const urlFromEnv = (import.meta as any).env?.VITE_SUPABASE_URL
const keyFromEnv = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

// Fallback via window.__env (carregado por /env.js no index.html)
const urlFromWindow =
  (typeof window !== 'undefined' && (window as any).__env?.VITE_SUPABASE_URL) || ''
const keyFromWindow =
  (typeof window !== 'undefined' && (window as any).__env?.VITE_SUPABASE_ANON_KEY) || ''

const supabaseUrl = (urlFromEnv || urlFromWindow) as string
const supabaseAnonKey = (keyFromEnv || keyFromWindow) as string

// LOG TEMPORÁRIO para ver o que está chegando no navegador
if (typeof window !== 'undefined') {
  console.log('[supabaseClient] VITE_SUPABASE_URL =', supabaseUrl || '(vazio)')
  console.log('[supabaseClient] VITE_SUPABASE_ANON_KEY =', supabaseAnonKey ? 'ok' : '(vazio)')
}

if (!supabaseUrl || !/^https?:\/\//i.test(supabaseUrl)) {
  // Isso evita o erro "Invalid supabaseUrl" e te dá um log claro de diagnóstico.
  throw new Error(
    `Supabase URL inválida. Recebido: "${supabaseUrl}". Verifique se /env.js carregou ou se o .env foi injetado.`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 5 } }
})

// Canal único + subscribe garantido (usado no Admin para publicar)
export const broadcastCh = supabase.channel('tv-broadcast', { config: { broadcast: { self: true } } })

let broadcastSubscribed: Promise<void> | null = null
export function ensureBroadcastSubscribed() {
  if (!broadcastSubscribed) {
    broadcastSubscribed = new Promise<void>((resolve) => {
      const res = broadcastCh.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve()
      })
      if (res === 'SUBSCRIBED') queueMicrotask(() => resolve())
    })
  }
  return broadcastSubscribed
}