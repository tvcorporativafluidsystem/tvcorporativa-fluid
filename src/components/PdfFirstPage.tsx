// src/components/PdfFirstPage.tsx
import { useEffect, useRef, useState } from 'react'
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist/build/pdf.mjs'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerSrc

// Caches em memória (por URL versionada)
const firstPageBitmapCache = new Map<string, ImageBitmap>()
const arrayBufferCache = new Map<string, ArrayBuffer>()

type Props = {
  url: string          // URL já versionada (?v=)
  onReady: () => void  // chamado ao terminar a 1ª página
}

export default function PdfFirstPage({ url, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function drawBitmapFast(bmp: ImageBitmap) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      // Ajusta canvas ao tamanho do bitmap
      canvas.width = bmp.width
      canvas.height = bmp.height
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bmp, 0, 0)
      if (!cancelled) {
        setLoading(false)
        onReady() // ✅ pronto imediatamente
      }
    }

    async function run() {
      setLoading(true)
      setError(null)

      // 1) Se temos a 1ª página cacheada como bitmap → pinta e finaliza (instantâneo)
      const cachedBmp = firstPageBitmapCache.get(url)
      if (cachedBmp) {
        await drawBitmapFast(cachedBmp)
        return
      }

      try {
        // 2) Busca ArrayBuffer (do cache ou rede)
        let buf = arrayBufferCache.get(url)
        if (!buf) {
          const res = await fetch(url, { mode: 'cors', cache: 'force-cache' })
          buf = await res.arrayBuffer()
          arrayBufferCache.set(url, buf)
        }
        if (cancelled) return

        // 3) Carrega o PDF a partir do buffer
        const task = getDocument({ data: buf })
        const pdf: PDFDocumentProxy = await task.promise
        if (cancelled) return

        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1 })

        // scale para "contain" na tela
        const ww = window.innerWidth
        const wh = window.innerHeight
        const scale = Math.min(ww / viewport.width, wh / viewport.height)
        const scaled = page.getViewport({ scale })

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        canvas.width = Math.floor(scaled.width)
        canvas.height = Math.floor(scaled.height)
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        await page.render({ canvasContext: ctx as any, viewport: scaled }).promise

        // 4) Gera um bitmap cacheável desta 1ª página renderizada
        const bmp = await createImageBitmap(canvas)
        firstPageBitmapCache.set(url, bmp)

        if (!cancelled) {
          setLoading(false)
          onReady()
        }
      } catch (e: any) {
        console.error('[PdfFirstPage] erro:', e)
        setError(e?.message || 'Falha ao abrir PDF')
        setLoading(false)
        // (Opcional) Poderíamos notificar o pai para cair em fallback
      }
    }

    run()
    return () => { cancelled = true }
  }, [url, onReady])

  return (
    <div className="w-full h-full grid place-items-center bg-black">
      {loading && !error && <div className="text-gray-400">Abrindo PDF…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  )
}