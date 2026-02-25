
import { supabase } from './supabaseClient'
import type { Midia } from '../types'

const TABLE = 'midias'
const BUCKET = 'tv-corporativa'

function sanitizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function mimeFromExt(name: string): string | undefined {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }
  return map[ext]
}

function uniqueId() {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      // @ts-ignore
      return crypto.randomUUID()
    }
  } catch {}
  return Math.random().toString(36).slice(2)
}

export async function listMidias(): Promise<Midia[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('ordem', { ascending: true })

  if (error) throw error
  return (data || []) as Midia[]
}

export async function insertMidia(payload: Omit<Midia, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single()
  if (error) throw error
  return data as Midia
}

export async function updateMidia(id: string, patch: Partial<Midia>) {
  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data as Midia
}

export async function deleteMidia(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function reorderMidias(orderedIds: string[]) {
  const updates = orderedIds.map((id, idx) =>
    supabase.from(TABLE).update({ ordem: idx + 1 }).eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r: any) => r.error)
  if (failed) throw failed.error
}

export async function toggleAtivo(id: string, ativo: boolean) {
  return updateMidia(id, { ativo })
}

export async function uploadToStorage(file: File) {
  const safeName = sanitizeName(file.name)
  const path = `uploads/${Date.now()}-${uniqueId()}-${safeName}`
  const contentType = file.type || mimeFromExt(file.name)

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '86400', // 24h – acelera muito as próximas execuções
    upsert: false,
    contentType,
  })
  if (error) {
    console.error('[uploadToStorage] erro:', error)
    throw error
  }

  const { data: pub } = await supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, publicUrl: pub.publicUrl }
}
