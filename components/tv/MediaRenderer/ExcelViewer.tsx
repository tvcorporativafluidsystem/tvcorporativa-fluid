import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'

export default function ExcelViewer({ src, duration, onDone }: { src: string; duration: number; onDone: () => void }) {
  const [html, setHtml] = useState<string>('Carregando Excel...')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(src)
        const buf = await res.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const htmlTable = XLSX.utils.sheet_to_html(ws, { header: '', id: 'x-table', editable: false })
        if (mounted) setHtml(htmlTable)
      } catch {
        if (mounted) setHtml('<p style="color:#ccc">Falha ao carregar Excel.</p>')
      }
    })()
    const t = setTimeout(onDone, (duration || 15) * 1000)
    return () => { mounted = false; clearTimeout(t) }
  }, [src, duration])

  return <div className="w-full h-full overflow-auto p-4 bg-slate-900" dangerouslySetInnerHTML={{ __html: html }} />
}