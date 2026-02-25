// src/hooks/usePlaylist.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Midia } from '../types'
import { listMidias } from '../services/mediaService'
import { getTransmissao } from '../services/transmissaoService'
import { useRealtime } from './useRealtime'

export function usePlaylist() {
  const [midias, setMidias] = useState<Midia[]>([])
  const [loading, setLoading] = useState(true)
  const [transmitindo, setTransmitindo] = useState(false)

  // versão baseada no updated_at da transmissão
  const lastUpdated = useRef<number>(Date.now())

  // ⬇️ novo: armazena a URL do wallpaper da TV (estado "aguardando")
  const wallpaperUrlRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [m, t] = await Promise.all([listMidias(), getTransmissao()])

      const ativosOrdenados = (m || [])
        .filter((x) => x.ativo)
        .sort((a, b) => a.ordem - b.ordem)

      setMidias(ativosOrdenados)
      setTransmitindo(!!t?.status)

      // ⬇️ guarda a URL do wallpaper (pode ser null)
      wallpaperUrlRef.current = (t as any)?.wallpaper_url || null

      const versionTs = t?.updated_at ? new Date(t.updated_at).getTime() : Date.now()
      lastUpdated.current = versionTs
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // já escutando realtime de midias + transmissao
  useRealtime(load)

  const ordered = useMemo(() => midias.sort((a, b) => a.ordem - b.ordem), [midias])

  return {
    midias: ordered,
    transmitindo,
    loading,
    reload: load,
    lastUpdated: lastUpdated.current,
    // ⬇️ novo: expõe para a TV usar como background quando não estiver transmitindo
    wallpaperUrl: wallpaperUrlRef.current,
  }
}