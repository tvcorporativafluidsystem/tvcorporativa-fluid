import { useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export function useBroadcast({
  onPublish,
  onEmergency,
  onPlaylistChange
}: {
  onPublish?: (payload?: any) => void
  onEmergency?: (payload?: any) => void
  onPlaylistChange?: () => void
}) {
  useEffect(() => {
    if (!supabase || typeof (supabase as any).channel !== 'function') {
      console.warn('Supabase não está pronto para Realtime.')
      return
    }

    // Realtime Postgres: tabela playlist
    const playlistSub = supabase
      .channel('db:playlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlist' }, () => {
        console.log('[useBroadcast] postgres_changes → playlist')
        try { onPlaylistChange?.() } catch {}
      })
      .subscribe()

    // Broadcast: publish & emergency
    const channel = supabase.channel('tv-broadcast', { config: { broadcast: { self: true } } })
    channel.on('broadcast', { event: 'publish' }, (msg: any) => {
      console.log('[useBroadcast] broadcast publish', msg?.payload)
      try { onPublish?.(msg.payload) } catch {}
    })
    channel.on('broadcast', { event: 'emergency' }, (msg: any) => {
      console.log('[useBroadcast] broadcast emergency', msg?.payload)
      try { onEmergency?.(msg.payload) } catch {}
    })
    channel.subscribe()

    return () => {
      try { supabase.removeChannel(playlistSub) } catch {}
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [])
}