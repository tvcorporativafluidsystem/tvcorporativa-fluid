// src/pages/Tv.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  versioned,
  warmUpUrls,
  getBlobObjectUrl,
  clearBlobCacheExceptVersion,
  warmUpPdfBlobs,
} from '../services/cache'
import { usePlaylist } from '../hooks/usePlaylist'
import { isOffice, officeEmbedUrl } from '../utils/file'
import { useFullscreen } from '../hooks/useFullscreen'
import type { Midia } from '../types'
import PdfFirstPage from '../components/PdfFirstPage'

type NowPlaying = { index: number; key: number }

// UX / performance
const MIN_IMAGE_SECONDS = 4
const MIN_PDF_SECONDS = 15
const MIN_OFFICE_SECONDS = 10
const READY_FALLBACK_MS = 2500
const FADING_MS = 120
const LOOKAHEAD = 2

export default function Tv() {
  const { midias, transmitindo, loading, reload, lastUpdated, wallpaperUrl } = usePlaylist()

  const [np, setNp] = useState<NowPlaying>({ index: 0, key: 0 })
  const [fading, setFading] = useState(false)

  const timerRef = useRef<number | null>(null)
  const readyTimerRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isFullscreen, enter } = useFullscreen()

  const version = useMemo(() => String(lastUpdated || 0), [lastUpdated])

  const current: Midia | null = midias[np.index] || null
  const currentUrl = current ? versioned(current.url, version) : null
  const officeUrl = current && isOffice(current.tipo)
    ? officeEmbedUrl(versioned(current.url, version), current.tipo)
    : null

  // Warm-up (badge)
  const [warming, setWarming] = useState(false)
  const [warmProgress, setWarmProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })

  // PDF blob: (fallback / diagnóstico)
  const [pdfSrc, setPdfSrc] = useState<string | null>(null)

  // 🚀 Queremos som por padrão: faremos best-effort para ativar sem interação.
  const [wantSound] = useState(true)
  // controle interno do retry para desmutar
  const unmuteRetryTimer = useRef<number | null>(null)
  const unmuteRetriesLeft = useRef<number>(0)

  function clearTimers() {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null }
    if (readyTimerRef.current) { window.clearTimeout(readyTimerRef.current); readyTimerRef.current = null }
    if (unmuteRetryTimer.current) { window.clearTimeout(unmuteRetryTimer.current); unmuteRetryTimer.current = null }
  }

  function next() {
    clearTimers()
    setFading(true)
    setTimeout(() => {
      setNp((prev) => ({
        index: midias.length > 0 ? (prev.index + 1) % midias.length : 0,
        key: prev.key + 1,
      }))
      setFading(false)
    }, FADING_MS)
  }

  useEffect(() => { clearBlobCacheExceptVersion(version) }, [version])

  useEffect(() => {
    let cancelled = false
    async function preparePdfBlob() {
      if (!current || current.tipo !== 'pdf' || !currentUrl) { setPdfSrc(null); return }
      const blobUrl = await getBlobObjectUrl(currentUrl, version).catch(() => currentUrl)
      if (!cancelled) setPdfSrc(blobUrl)
    }
    preparePdfBlob()
    return () => { cancelled = true }
  }, [current?.id, current?.tipo, currentUrl, version])

  useEffect(() => {
    if (!transmitindo || !midias.length) return
    const urls = midias.map((m) => versioned(m.url, version))
    setWarming(true)
    setWarmProgress({ done: 0, total: urls.length })
    warmUpUrls(urls, (done, total) => setWarmProgress({ done, total }))
      .catch((e) => console.warn('[warmUpUrls] erro:', e))
      .finally(() => setWarming(false))

    const pdfUrls = midias.filter((m) => m.tipo === 'pdf').map((m) => versioned(m.url, version))
    if (pdfUrls.length) warmUpPdfBlobs(version, pdfUrls).catch((e) => console.warn('[warmUpPdfBlobs] erro:', e))
  }, [transmitindo, version, midias.map((m) => m.url).join('|')])

  const lookaheadItems = useMemo(() => {
    if (!midias.length) return []
    const res: { item: Midia; url: string }[] = []
    for (let step = 1; step <= Math.min(LOOKAHEAD, midias.length - 1); step++) {
      const idx = (np.index + step) % midias.length
      const item = midias[idx]
      res.push({ item, url: versioned(item.url, version) })
    }
    return res
  }, [np.index, midias, version])

  useEffect(() => {
    if (!current || midias.length === 0) return
    const prefetchImage = (url: string) => {
      const img = new Image()
      img.decoding = 'async'
      ;(img as any).fetchPriority = 'low'
      img.src = url
    }
    const warmHead = async (url: string) => { try { await fetch(url, { method: 'HEAD', mode: 'no-cors' }).catch(() => {}) } catch {} }

    lookaheadItems.forEach(({ item, url }) => {
      if (item.tipo === 'image') prefetchImage(url)
      if (item.tipo === 'video' || item.tipo === 'audio' || item.tipo === 'pdf') warmHead(url)
      if (item.tipo === 'pdf') getBlobObjectUrl(url, version).catch(() => {})
    })
  }, [lookaheadItems, current, midias.length, version])

  // Temporização baseada em "ready"
  useEffect(() => {
    if (!current || !transmitindo) return
    clearTimers()

    if (current.tipo === 'image') {
      readyTimerRef.current = window.setTimeout(() => {
        const secs = Math.max(MIN_IMAGE_SECONDS, current.tempo_exibicao || 6)
        timerRef.current = window.setTimeout(next, secs * 1000)
      }, READY_FALLBACK_MS)
      return
    }

    if (current.tipo === 'video') {
      const v = videoRef.current
      if (!v) return

      // Sempre que vamos tocar vídeo, pausamos qualquer <audio> paralelo
      if (audioRef.current && !audioRef.current.paused) {
        try { audioRef.current.pause() } catch {}
      }

      // Tentativa 1: tocar COM som (muted=false)
      const tryPlayWithSound = async () => {
        try {
          v.muted = false
          v.volume = 1.0
          await v.play()
          // sucesso com som
          // console.log('[video] play com som OK')
        } catch {
          // Falhou (bloqueio: sem gesto) -> fallback mudo
          // console.warn('[video] play com som bloqueado, caindo para muted autoplay')
          v.muted = true
          try { await v.play() } catch {
            // Se até mudo falhar, não temos o que fazer aqui.
          }
          // Inicia um retry para desmutar sozinho por alguns segundos
          startUnmuteRetries()
        }
      }

      // Fazemos a tentativa assim que possível
      v.preload = 'auto'
      v.playsInline = true

      const handleMeta = () => {
        const dur = Math.ceil(v.duration || 0)
        const wait = Math.max(dur * 1000, (current.tempo_exibicao || 0) * 1000)
        timerRef.current = window.setTimeout(next, wait)
      }

      // Configura retries para desmutar automaticamente por ~8s (16 tentativas a cada 500ms)
      const startUnmuteRetries = () => {
        if (!wantSound) return
        unmuteRetriesLeft.current = 16
        const tick = async () => {
          if (!videoRef.current) return
          const vv = videoRef.current
          if (unmuteRetriesLeft.current <= 0) {
            unmuteRetryTimer.current = null
            return
          }
          unmuteRetriesLeft.current -= 1
          try {
            vv.muted = false
            vv.volume = 1.0
            await vv.play()
            // Se tocar sem erro, paramos os retries
            unmuteRetriesLeft.current = 0
            unmuteRetryTimer.current = null
            // console.log('[video] som liberado durante retry')
            return
          } catch {
            // segue tentando
            unmuteRetryTimer.current = window.setTimeout(tick, 500) as unknown as number
          }
        }
        // inicia em 500ms para dar tempo de buffer
        unmuteRetryTimer.current = window.setTimeout(tick, 500) as unknown as number
      }

      // Dispara tentativas
      tryPlayWithSound()

      // Timer pela duração
      if (v.readyState >= 1) handleMeta()
      else v.addEventListener('loadedmetadata', handleMeta, { once: true })

      v.addEventListener('ended', next, { once: true })
      return () => {
        v.removeEventListener('ended', next)
      }
    }

    if (current.tipo === 'audio') {
      const a = audioRef.current
      if (!a) return
      const handleMeta = () => {
        const dur = Math.ceil(a.duration || 0)
        const wait = Math.max(dur * 1000, (current.tempo_exibicao || 0) * 1000)
        timerRef.current = window.setTimeout(next, wait)
      }
      const start = async () => {
        try {
          // Para áudio puro, alguns navegadores exigem gesto. Tentamos mesmo assim:
          a.muted = false
          a.volume = 1
          await a.play()
        } catch {
          // Fallback: tenta mudo (alguns nem tocam áudio mudo), e não força som.
          try { a.muted = true; await a.play() } catch {}
        }
      }
      start()
      if (a.readyState >= 1) handleMeta()
      else a.addEventListener('loadedmetadata', handleMeta, { once: true })
      a.addEventListener('ended', next, { once: true })
      return () => a.removeEventListener('ended', next)
    }
  }, [np.key, midias, transmitindo])

  useEffect(() => { setNp({ index: 0, key: Date.now() }) }, [midias.length])

  // Atalhos (mantidos; sem toggle de som pois agora tentamos automaticamente)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key.toLowerCase() === 'f') enter()
      if (e.key.toLowerCase() === 'r') reload()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [enter, reload])

  return (
    <div className="w-screen h-screen bg-black text-white overflow-hidden relative">
      {warming && (
        <div className="absolute top-4 left-4 z-20 text-[11px] bg-white/10 px-2 py-1 rounded">
          Pré-carregando mídias… {warmProgress.done}/{warmProgress.total}
        </div>
      )}

      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-20">
          <button onClick={enter} className="px-3 py-2 text-xs rounded bg-white/10 hover:bg-white/20">Tela cheia (F)</button>
        </div>
      )}

      {/* Wallpaper quando NÃO está transmitindo (mensagem só se NÃO houver wallpaper) */}
      {!transmitindo && (
        <WallpaperAuto url={wallpaperUrl || ''} overlayOpacity={0.4}>
          {/* children renderiza apenas se não houver wallpaper carregado */}
          <div className="relative text-center z-10">
            <h2 className="text-3xl font-semibold">Tela da TV</h2>
            <p className="text-muted mt-3">Aguardando transmissão…</p>
            <p className="text-xs text-muted/80 mt-6">
              Abra o painel /admin e clique em “Transmitir para TV”.
            </p>
          </div>
        </WallpaperAuto>
      )}

      {transmitindo && (
        <div className={`w-full h-full ${fading ? 'opacity-0 transition-opacity duration-100' : 'opacity-100'}`}>
          {loading && <div className="w-full h-full grid place-items-center text-muted">Carregando…</div>}
          {!loading && !current && <div className="w-full h-full grid place-items-center text-muted">Playlist vazia</div>}

          {!loading && current && (
            <div className="w-full h-full">
              {/* IMAGEM */}
              {current.tipo === 'image' && currentUrl && (
                <img
                  key={np.key}
                  src={currentUrl}
                  className="object-contain w-full h-full"
                  decoding="async"
                  fetchPriority="high"
                  onLoad={() => {
                    clearTimers()
                    const secs = Math.max(MIN_IMAGE_SECONDS, current.tempo_exibicao || 6)
                    timerRef.current = window.setTimeout(next, secs * 1000)
                  }}
                />
              )}

              {/* VÍDEO (best-effort som automático) */}
              {current.tipo === 'video' && currentUrl && (
                <video
                  key={np.key}
                  ref={videoRef}
                  src={currentUrl}
                  className="object-contain w-full h-full"
                  autoPlay
                  preload="auto"
                  controls={false}
                  playsInline
                  onLoadedMetadata={() => {
                    const v = videoRef.current
                    if (!v) return
                    const dur = Math.ceil(v.duration || 0)
                    const wait = Math.max(dur * 1000, (current.tempo_exibicao || 0) * 1000)
                    clearTimers()
                    timerRef.current = window.setTimeout(next, wait)
                  }}
                  onError={(e) => {
                    console.warn('[video] erro ao carregar', e)
                  }}
                />
              )}

              {/* ÁUDIO */}
              {current.tipo === 'audio' && currentUrl && (
                <div className="w-full h-full grid place-items-center">
                  <audio key={np.key} ref={audioRef} src={currentUrl} autoPlay />
                  <p className="text-muted mt-3">Reproduzindo áudio: {current.nome}</p>
                </div>
              )}

              {/* PDF */}
              {current.tipo === 'pdf' && currentUrl && (
                <PdfFirstPage
                  key={np.key}
                  url={currentUrl}
                  onReady={() => {
                    clearTimers()
                    const secs = Math.max(MIN_PDF_SECONDS, current.tempo_exibicao || 8)
                    timerRef.current = window.setTimeout(next, secs * 1000)
                  }}
                />
              )}

              {/* OFFICE */}
              {isOffice(current.tipo) && officeUrl && (
                <iframe
                  key={np.key}
                  src={officeUrl}
                  className="w-full h-full bg-white"
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={() => {
                    clearTimers()
                    const secs = Math.max(MIN_OFFICE_SECONDS, current.tempo_exibicao || 8)
                    timerRef.current = window.setTimeout(next, secs * 1000)
                  }}
                  allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                />
              )}

              {/* PRÓXIMO (pré‑montagem) */}
              {lookaheadItems.slice(0, 1).map(({ item, url }) => (
                <div
                  key={`next-${np.key}-${item.id}`}
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 pointer-events-none -z-10"
                  style={{ visibility: 'hidden' }}
                >
                  {item.tipo === 'image' && <img src={url} alt="" decoding="async" />}
                  {item.tipo === 'video' && <video src={url} preload="auto" muted playsInline />}
                  {item.tipo === 'audio' && <audio src={url} preload="auto" />}
                  {item.tipo === 'pdf' && (
                    <link rel="prefetch" href={url} as="fetch" crossOrigin="anonymous" />
                  )}
                  {isOffice(item.tipo) && (
                    <iframe
                      src={officeEmbedUrl(url, item.tipo)}
                      className="w-full h-full"
                      style={{ display: 'none' }}
                      loading="eager"
                      referrerPolicy="no-referrer-when-downgrade"
                      allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Wallpaper auto-ajustável (cover/contain) com blur de fundo.
 * Renderiza children (mensagem) somente quando NÃO há wallpaper carregado.
 */
function WallpaperAuto({
  url,
  children,
  overlayOpacity = 0.4,
}: {
  url: string
  children?: ReactNode
  overlayOpacity?: number
}) {
  const [fit, setFit] = useState<'cover' | 'contain'>('cover')
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)

  const safeUrl = useMemo(() => (url && typeof url === 'string' ? url : ''), [url])

  useEffect(() => {
    if (!safeUrl) {
      setLoadedUrl(null)
      return
    }

    const img = new Image()
    img.decoding = 'async'
    ;(img as any).fetchPriority = 'low'
    img.src = safeUrl

    const decideFit = () => {
      const iw = img.naturalWidth || 0
      const ih = img.naturalHeight || 0
      const vw = window.innerWidth
      const vh = window.innerHeight

      if (iw === 0 || ih === 0) {
        setFit('cover')
        setLoadedUrl(null)
        return
      }
      const ir = iw / ih
      const vr = vw / vh
      const isMuchSmaller = iw < vw * 0.7 && ih < vh * 0.7
      const ratioDiff = Math.abs(ir - vr) / vr
      setFit(isMuchSmaller || ratioDiff > 0.35 ? 'contain' : 'cover')
      setLoadedUrl(safeUrl)
    }

    if (img.complete) decideFit()
    else {
      img.onload = decideFit
      img.onerror = () => { setFit('cover'); setLoadedUrl(null) }
    }

    const onResize = () => {
      if (!loadedUrl) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const iw = (img.naturalWidth || 0)
      const ih = (img.naturalHeight || 0)
      if (iw && ih) {
        const ir = iw / ih
        const vr = vw / vh
        const isMuchSmaller = iw < vw * 0.7 && ih < vh * 0.7
        const ratioDiff = Math.abs(ir - vr) / vr
        setFit(isMuchSmaller || ratioDiff > 0.35 ? 'contain' : 'cover')
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [safeUrl, loadedUrl])

  return (
    <div className="w-full h-full relative overflow-hidden grid place-items-center p-8">
      <div className="absolute inset-0 bg-black" />
      {!!loadedUrl && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${loadedUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: fit === 'contain' ? 'blur(24px) brightness(0.6)' : 'none',
            transform: 'scale(1.05)',
          }}
        />
      )}
      {!!loadedUrl && (
        <img
          src={loadedUrl}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: fit, objectPosition: 'center' }}
          decoding="async"
          fetchPriority="low"
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />
      {!loadedUrl && (
        <div className="relative z-10 text-center">
          {children}
        </div>
      )}
    </div>
  )
}