// src/services/dataService.ts
import { supabase, broadcastCh, ensureBroadcastSubscribed } from './supabaseClient'
import type { DBFile, PlaylistRow } from '../types/db'

// Detecta tipo pelo nome/extensão
export function detectType(fileName: string, mime?: string): DBFile['tipo'] {
  const ext = (fileName.split('.').pop() || '').toLowerCase()
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'xlsx') return 'excel'
  if (['pptx', 'docx'].includes(ext)) return 'office'
  return 'other'
}

// Upload para bucket media + URL pública
export async function uploadToStorage(file: File, onProgress?: (p: number) => void) {
  onProgress?.(10)
  const path = `${Date.now()}_${file.name}`
  const { data, error } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })
  if (error) throw error
  onProgress?.(75)
  const { data: pub } = supabase.storage.from('media').getPublicUrl(data.path)
  onProgress?.(100)
  return { path: data.path, publicUrl: pub.publicUrl }
}

// Insere metadados do arquivo
export async function insertFileRow(file: File, url: string, tipo: DBFile['tipo']): Promise<DBFile> {
  const { data, error } = await supabase
    .from('files')
    .insert({ nome: file.name, tipo, url, tamanho: file.size, metadata: { mime: file.type } })
    .select('*')
    .single()
  if (error) throw error
  return data as DBFile
}

// Lista de arquivos (ordem desc)
export async function listFiles(): Promise<DBFile[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as DBFile[]
}

// Lista playlist ativa com join do arquivo
export async function listPlaylist(): Promise<PlaylistRow[]> {
  const { data, error } = await supabase
    .from('playlist')
    .select('id, file_id, ordem, tempo_exibicao, ativo, created_at, updated_at, files:files(*)')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r: any) => ({ ...r, file: r.files })) as PlaylistRow[]
}

// Substitui a playlist (POC) por payload
export async function replacePlaylist(items: { file_id: string; ordem: number; tempo_exibicao?: number | null }[]) {
  console.log('[dataService] replacePlaylist items:', items)
  const { error: delErr } = await supabase
    .from('playlist')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) { console.error('[dataService] delete error:', delErr); throw delErr }

  const payload = items.map(i => ({
    file_id: i.file_id,
    ordem: i.ordem,
    tempo_exibicao: i.tempo_exibicao ?? null,
    ativo: true
  }))
  const { error: insErr } = await supabase.from('playlist').insert(payload)
  if (insErr) { console.error('[dataService] insert error:', insErr); throw insErr }
}

// RPC para publicar + broadcast
export async function publishNow() {
  console.log('[dataService] publishNow → RPC increment_broadcast_version')
  const { error: rpcErr } = await supabase.rpc('increment_broadcast_version')
  if (rpcErr) { console.error('[dataService] RPC error:', rpcErr); throw rpcErr }

  console.log('[dataService] publishNow → ensure broadcast subscribed')
  await ensureBroadcastSubscribed()

  console.log('[dataService] publishNow → sending broadcast event')
  const res = await broadcastCh.send({
    type: 'broadcast',
    event: 'publish',
    payload: { at: new Date().toISOString() }
  } as any)
  console.log('[dataService] channel.send result:', res)
}

// Emergência (grava + broadcast)
export async function setEmergency(active: boolean, title?: string, body?: string, theme?: 'danger' | 'warning' | 'info') {
  const { error } = await supabase
    .from('emergency_message')
    .update({
      active,
      title: title ?? null,
      body: body ?? null,
      theme: theme ?? 'danger',
      updated_at: new Date().toISOString()
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error

  await ensureBroadcastSubscribed()
  await broadcastCh.send({
    type: 'broadcast',
    event: 'emergency',
    payload: { active, title, body, theme, at: new Date().toISOString() }
  } as any)
}