import { MediaTipo } from '../types'

export function inferTipoByNameOrMime(name: string, mime?: string): MediaTipo {
  const n = name.toLowerCase()
  const m = (mime || '').toLowerCase()

  const is = (arr: string[]) => arr.some((x) => n.endsWith('.' + x) || m.includes(x))

  if (is(['jpg', 'jpeg', 'png', 'webp'])) return 'image'
  if (is(['mp4', 'webm'])) return 'video'
  if (is(['mp3'])) return 'audio'
  if (is(['pdf'])) return 'pdf'
  if (is(['docx'])) return 'office-doc'
  if (is(['xlsx'])) return 'office-sheet'
  if (is(['pptx'])) return 'office-ppt'
  return 'unknown'
}

export function officeEmbedUrl(publicUrl: string, tipo: MediaTipo) {
  // Usa o Office Web Viewer para docx/xlsx/pptx
  // Observação: precisa de URL pública (Supabase Storage com "public")
  const supported: MediaTipo[] = ['office-doc', 'office-sheet', 'office-ppt']
  if (!supported.includes(tipo)) return null
  const src = encodeURIComponent(publicUrl)
  return `https://view.officeapps.live.com/op/embed.aspx?src=${src}`
}

export function isOffice(tipo: MediaTipo) {
  return ['office-doc', 'office-sheet', 'office-ppt'].includes(tipo)
}