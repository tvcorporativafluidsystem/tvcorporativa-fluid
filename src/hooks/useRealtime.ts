import { useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

/**
 * Assina alterações das tabelas 'midias' e 'transmissao' via Realtime.
 * Chama onChange() a cada INSERT/UPDATE/DELETE.
 */
export function useRealtime(onChange: () => void) {
  useEffect(() => {
    const ch = supabase
      .channel('tv-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'midias' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transmissao' }, onChange)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // ok
        }
      })

    return () => {
      supabase.removeChannel(ch)
    }
  }, [onChange])
}