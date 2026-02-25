import { useEffect, useRef, useState } from 'react'
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerSrc

type Props = {
  url: string
  totalSeconds: number      // tempo total desejado para todo o PDF
  onDone: () => void        // chamado ao terminar
}

export default function PdfCanvas({ url, totalSeconds, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let pageIndex = 1
    let pdfDoc: PDFDocumentProxy | null = null
    let timer: number | null = null
    const t0 = performance.now()

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || cancelled) return

      const page = await pdfDoc.getPage(pageIndex)
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
      try {
        const task = getDocument({ url, withCredentials: false })
        pdfDoc = await task.promise
        if (cancelled) return
        setLoading(false)

        const pages = Math.max(1, pdfDoc.numPages || 1)
        const MIN_PER_PAGE_MS = 4000
        const MIN_TOTAL_MS = 15000
        const desiredTotalMs = Math.max(MIN_TOTAL_MS, totalSeconds * 1000)

        let perPageMs = Math.floor(desiredTotalMs / pages)
        if (perPageMs < MIN_PER_PAGE_MS) perPageMs = MIN_PER_PAGE_MS

        const afterLoad = () => {
          const elapsedLoadMs = performance.now() - t0
          const plannedMs = perPageMs * pages
          const extraMs = Math.max(0, (desiredTotalMs - plannedMs) + elapsedLoadMs)
          return extraMs
        }

        const step = async () => {
          if (cancelled) return
          await renderPage()
          if (pageIndex < pages) {
            pageIndex += 1
            timer = window.setTimeout(step, perPageMs)
          } else {
            const extra = afterLoad()
            if (extra > 0) {
              timer = window.setTimeout(onDone, extra)
            } else {
              onDone()
            }
          }
        }

        step()
      } catch (e) {
        console.error('[PdfCanvas] Falha ao carregar/renderizar PDF:', e)
        onDone()
      }
    }

    run()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [url, totalSeconds, onDone])

  return (
    <div className="w-full h-full grid place-items-center bg-black">
      {loading && <div className="text-gray-400">Carregando PDF…</div>}
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  )
}