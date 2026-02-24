export type DBFile = {
  id: string
  nome: string
  tipo: 'video' | 'image' | 'pdf' | 'excel' | 'office' | 'other'
  url: string
  tamanho: number
  created_at: string
  metadata?: Record<string, any>
}

export type PlaylistRow = {
  id: string
  file_id: string
  ordem: number
  tempo_exibicao: number | null
  ativo: boolean
  created_at: string
  updated_at: string
  file?: DBFile
}

export type EmergencyMessage = {
  id: string
  active: boolean
  title: string | null
  body: string | null
  theme: 'danger' | 'warning' | 'info'
  updated_at: string
}