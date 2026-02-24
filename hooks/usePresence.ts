import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

export function usePresence(room: string, key: string) {
  const [peers, setPeers] = useState<any[]>([])

  useEffect(() => {
    if (!supabase || typeof (supabase as any).channel !== 'function') {
      console.warn('Supabase não está pronto para Presence.')
      return
    }
    const channel = supabase.channel(room, { config: { presence: { key } } })
    channel.on('presence', { event: 'sync' }, () => {
      try {
        const state = channel.presenceState()
        const flat = Object.values(state).flat()
        setPeers(flat as any[])
      } catch (e) { console.warn(e) }
    })
    channel.subscribe(async (status: any) => {
      if (status === 'SUBSCRIBED') {
        try { await channel.track({ userAgent: navigator.userAgent, online_at: new Date().toISOString() }) } catch {}
      }
    })
    return () => { try { supabase.removeChannel(channel) } catch {} }
  }, [room, key])

  return { peers, count: peers.length }
}