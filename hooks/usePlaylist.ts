import { useCallback, useEffect, useState } from 'react'
import { listPlaylist } from '../services/dataService'
import type { PlaylistRow } from '../types/db'

export function usePlaylist() {
  const [items, setItems] = useState<PlaylistRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      console.log('[usePlaylist] carregando playlist…')
      const data = await listPlaylist()
      console.log('[usePlaylist] recebido', data)
      setItems(data)
    } catch (e: any) {
      console.error('[usePlaylist] erro:', e)
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  return { items, loading, error, reload }
}