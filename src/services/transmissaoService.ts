// src/services/transmissaoService.ts
import { supabase } from './supabaseClient'
import type { Transmissao } from '../types'

const TABLE = 'transmissao'
const SINGLETON_ID = '00000000-0000-0000-0000-000000000001'

export async function getTransmissao(): Promise<Transmissao & { wallpaper_url?: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', SINGLETON_ID)
    .single()

  if (error && (error as any).code !== 'PGRST116') throw error
  return (data as any) || { id: SINGLETON_ID, status: false, wallpaper_url: null }
}

export async function setTransmissao(status: boolean) {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ id: SINGLETON_ID, status, updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  return data as Transmissao
}

/** Atualiza APENAS o updated_at (usamos para “pingar” as TVs). */
export async function touchTransmissao() {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: SINGLETON_ID, updated_at: now }, { onConflict: 'id' })
  if (error) throw error
}

/** Define/remover o wallpaper e toca o updated_at para a TV atualizar. */
export async function setWallpaper(url: string | null) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: SINGLETON_ID, wallpaper_url: url, updated_at: new Date().toISOString() })
  if (error) throw error
  return true
}