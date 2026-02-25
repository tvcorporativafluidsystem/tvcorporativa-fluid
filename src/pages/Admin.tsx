// src/pages/Admin.tsx
import AdminHeader from '../components/AdminHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import UploadZone from '../components/UploadZone'
import MediaList from '../components/MediaList'
import PlaylistToolbar from '../components/PlaylistToolbar'
import Button from '../components/ui/Button'
import { useEffect, useState } from 'react'
import { listMidias, uploadToStorage } from '../services/mediaService'
import { getTransmissao, setWallpaper } from '../services/transmissaoService'
import { Midia } from '../types'
import { useRealtime } from '../hooks/useRealtime'

export default function Admin() {
  const [items, setItems] = useState<Midia[]>([])
  const [transmitindo, setTransmitindo] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  // ⬇️ estado local do wallpaper atual
  const [wallpaper, setWallpaperState] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [m, t] = await Promise.all([listMidias(), getTransmissao()])
      setItems(m)
      setTransmitindo(!!t?.status)
      // ⬇️ lê wallpaper atual (pode ser null)
      setWallpaperState((t as any)?.wallpaper_url || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime(load)

  // === Actions do Card de Wallpaper ===
  async function handlePickWallpaper() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.jpg,.jpeg,.png,.webp'
    input.onchange = async (e: any) => {
      const file: File | undefined = e?.target?.files?.[0]
      if (!file) return
      // envia ao Storage com cache e contentType corretos
      const { publicUrl } = await uploadToStorage(file)
      // salva na tabela 'transmissao' (também atualiza updated_at)
      await setWallpaper(publicUrl)
      setWallpaperState(publicUrl)
    }
    input.click()
  }

  async function handleClearWallpaper() {
    await setWallpaper(null)
    setWallpaperState(null)
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />

      <main className="relative isolate max-w-7xl mx-auto px-6 py-8">
        <div className="relative isolate grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Coluna da playlist */}
          <div className="xl:col-span-2 min-w-0">
            <Card>
              <CardHeader
                title="Playlist"
                subtitle="Arraste para reordenar, ajuste o tempo e ative/desative"
                right={<PlaylistToolbar transmitindo={transmitindo} onReload={load} />}
              />
              <CardBody>
                {/* Deixe os itens respirarem sem cortar ações/overlays */}
                <div className="relative overflow-visible">
                  {loading ? (
                    <p className="text-muted">Carregando…</p>
                  ) : items.length === 0 ? (
                    <p className="text-muted">Nenhuma mídia. Faça upload ao lado.</p>
                  ) : (
                    <MediaList items={items} onChange={load} />
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Coluna do upload + wallpaper */}
          <div className="xl:col-span-1 min-w-0">
            {/* Card de Upload */}
            <Card>
              <CardHeader
                title="Upload de Arquivos"
                subtitle="jpg, png, webp, mp4, webm, mp3, pdf, docx, xlsx, pptx"
              />
              <CardBody>
                <div className="relative overflow-visible">
                  <UploadZone onUploaded={load} />
                  <div className="mt-6 text-xs text-muted leading-relaxed">
                    <p>Arquivos são carregados no Supabase Storage (bucket público).</p>
                    <p className="mt-2">
                      Office (docx, xlsx, pptx) é exibido via Office Web Viewer.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Card de Wallpaper da TV */}
            <Card className="mt-6">
              <CardHeader
                title="Wallpaper da TV (aguardando transmissão)"
                subtitle="Defina um papel de parede para a tela de espera. Recomendo imagem 1920×1080."
              />
              <CardBody>
                <div className="flex items-center gap-4">
                  <div
                    className="w-40 h-24 rounded border border-white/10 bg-black/30 bg-center bg-cover"
                    style={wallpaper ? { backgroundImage: `url("${wallpaper}")` } : {}}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handlePickWallpaper}>Escolher imagem</Button>
                    <Button variant="ghost" onClick={handleClearWallpaper} disabled={!wallpaper}>
                      Remover
                    </Button>
                  </div>
                </div>
                {!wallpaper && <p className="text-xs text-muted mt-3">Nenhuma imagem definida.</p>}
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}