import React, { useCallback, useEffect, useMemo, useState } from 'react'
import MediaRenderer from '../components/tv/MediaRenderer'
import { usePlaylist } from '../hooks/usePlaylist'
import { useBroadcast } from '../hooks/useBroadcast'
import { supabase } from '../services/supabaseClient'
import type { EmergencyMessage } from '../types/db'

export default function TV() {
  // Carrega playlist do banco (hook já existente)
  const { items, loading, reload } = usePlaylist()

  // Índice do item atual que está tocando
  const [idx, setIdx] = useState(0)
  const current = items.length ? items[idx % items.length] : null

  // Mensagem de emergência
  const [emergency, setEmergency] = useState<EmergencyMessage | null>(null)

  // Identificação local da TV
  const [tvId] = useState(() => localStorage.getItem('tv_id') || crypto.randomUUID())
  const [deviceLabel] = useState(() => localStorage.getItem('tv_label') || '')
  useEffect(() => { localStorage.setItem('tv_id', tvId) }, [tvId])

  // Presence: a TV entra/permanece “online”
  useEffect(() => {
    if (!supabase || typeof (supabase as any).channel !== 'function') return
    const room = supabase.channel('tv-presence', { config: { presence: { key: tvId } } })
    room.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        room.track({
          deviceLabel,
          userAgent: navigator.userAgent,
          online_at: new Date().toISOString()
        })
      }
    })
    return () => { try { supabase.removeChannel(room) } catch {} }
  }, [tvId, deviceLabel])

  // “Heartbeat” da TV no banco (opcional; histórico)
  useEffect(() => {
    const i = setInterval(async () => {
      try {
        await supabase
          .from('tv_clients')
          .upsert({ id: tvId, device_label: deviceLabel, last_seen: new Date().toISOString() })
      } catch {}
    }, 15000)
    return () => clearInterval(i)
  }, [tvId, deviceLabel])

  // Avança quando o item termina
  const onDone = useCallback(() => setIdx(prev => prev + 1), [])
  // Duração: vídeos deixam o próprio player decidir; demais usam tempo_exibicao
  const duration = useMemo(
    () => current ? (current.file?.tipo === 'video' ? undefined : (current.tempo_exibicao ?? 10)) : 10,
    [current]
  )

  // Realtime: PUBLICAR (recarrega playlist), EMERGÊNCIA (busca estado), alterações na tabela playlist
  useBroadcast({
    onPublish: () => reload(),
    onEmergency: async () => {
      const { data } = await supabase.from('emergency_message').select('*').limit(1).single()
      setEmergency(data as any)
    },
    onPlaylistChange: () => reload()
  })

  // Estado de emergência inicial (ao abrir a TV)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('emergency_message').select('*').limit(1).single()
      setEmergency(data as any)
    })()
  }, [])

  // (Opcional) Fullscreen — desativado no dev para evitar warning de “user gesture”
  // useEffect(() => {
  //   const el = document.documentElement
  //   const tryFs = async () => {
  //     if (!document.fullscreenElement) {
  //       try { await el.requestFullscreen() } catch {}
  //     }
  //   }
  //   const id = setTimeout(tryFs, 700)
  //   return () => clearTimeout(id)
  // }, [])

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Padrão discreto */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #6366f1 1px, transparent 1px), radial-gradient(circle at 80% 80%, #14b8a6 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">Carregando…</div>
      )}

      {!loading && (!items || items.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80">
          Aguardando publicação…
        </div>
      )}

      {!loading && items.length > 0 && current && (
        <div className="w-full h-full animate-fade">
          <MediaRenderer
            tipo={current.file?.tipo || 'other'}
            url={current.file?.url || ''}
            duration={duration as any}
            onDone={onDone}
          />
        </div>
      )}

      {emergency?.active && (
        <div
          className={`absolute top-0 left-0 w-full p-6 text-white ${
            emergency.theme === 'danger'
              ? 'bg-red-700/90'
              : emergency.theme === 'warning'
              ? 'bg-yellow-600/90'
              : 'bg-blue-700/90'
          }`}
        >
          <h3 className="text-2xl font-bold">{emergency.title}</h3>
          {emergency.body && <p className="text-lg mt-1">{emergency.body}</p>}
        </div>
      )}
    </div>
  )
}