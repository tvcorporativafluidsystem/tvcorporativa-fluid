// src/components/PdfPaged.tsx
import { useEffect, useRef, useState } from 'react'
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist/build/pdf.mjs'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerSrc

type Props = {
  url: string                 // URL já versionada (?v=...)
  totalSeconds: number        // tempo total desejado para o PDF (ex.: tempo_exibicao)
  minPerPageSec?: number      // mínimo por página (padrão 4s)
  onDone: () => void          // chamado ao terminar todas as páginas
}

/**
 * Renderiza PDF no canvas:
 *  - 1ª página aparece o mais rápido possível;
 *  - distribui o totalSeconds igualmente entre as páginas (com mínimo por página);
 *  - avança páginas automaticamente e chama onDone() no fim.
 */
export default function PdfPaged({ url, totalSeconds, minPerPageSec = 4, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let pdf: PDFDocumentProxy | null = null
    let pageIndex = 1
    let timer: number | null = null

    const renderPage = async (pageNum: number) => {
      if (!pdf || !canvasRef.current || cancelled) return
      const page = await pdf.getPage(pageNum)

      // dimensiona para "contain" em tela
      const viewport = page.getViewport({ scale: 1 })
      const ww = window.innerWidth
      const wh = window.innerHeight
      const scale = Math.min(ww / viewport.width, wh / viewport.height)
      const scaled = page.getViewport({ scale })

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      canvas.width = Math.floor(scaled.width)
      canvas.height = Math.floor(scaled.height)

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({ canvasContext: ctx, viewport: scaled }).promise
    }

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const t0 = performance.now()
        const task = getDocument({ url, withCredentials: false })
        pdf = await task.promise
        if (cancelled) return
        setLoading(false)

        const pages = Math.max(1, pdf.numPages || 1)
        const MIN_PER_PAGE_MS = Math.max(1000, minPerPageSec * 1000)
        const desiredTotalMs = Math.max(MIN_PER_PAGE_MS, totalSeconds * 1000)

        // distribui o tempo igualmente entre páginas, respeitando mínimo por página
        let perPageMs = Math.floor(desiredTotalMs / pages)
        if (perPageMs < MIN_PER_PAGE_MS) perPageMs = MIN_PER_PAGE_MS

        // 1) Mostra a primeira página
        await renderPage(pageIndex)

        // 2) Agenda as próximas páginas
        const step = async () => {
          if (cancelled) return
          if (pageIndex < pages) {
            pageIndex += 1
            await renderPage(pageIndex)
            timer = window.setTimeout(step, perPageMs)
          } else {
            // terminou todas as páginas
            onDone()
          }
        }

        // Compensa o tempo gasto para carregar e renderizar a primeira página
        const elapsed = performance.now() - t0
        const firstWait = Math.max(0, perPageMs - elapsed)
        timer = window.setTimeout(step, firstWait)
      } catch (e: any) {
        console.error('[PdfPaged] erro:', e)
        setError(e?.message || 'Falha ao abrir PDF')
        // não trave a TV; avance a playlist
        onDone()
      }
    }

    run()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [url, totalSeconds, minPerPageSec, onDone])

  return (
    <div className="w-full h-full grid place-items-center bg-black">
      {loading && !error && <div className="text-gray-400">Abrindo PDF…</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  )
}