export type MediaTipo = 'image' | 'video' | 'audio' | 'pdf' | 'office-doc' | 'office-sheet' | 'office-ppt' | 'unknown'

export interface Midia {
  id: string
  nome: string
  tipo: MediaTipo
  url: string
  tempo_exibicao: number
  ordem: number
  ativo: boolean
  created_at?: string
}

export interface Transmissao {
  id: string
  status: boolean
  updated_at?: string
}