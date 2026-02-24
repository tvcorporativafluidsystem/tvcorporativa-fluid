import React from 'react'
import VideoPlayer from './VideoPlayer'
import ImageViewer from './ImageViewer'
import PDFViewer from './PDFViewer'
import ExcelViewer from './ExcelViewer'
import OfficeViewer from './OfficeViewer'

export default function MediaRenderer({
  tipo,
  url,
  duration,
  onDone
}: {
  tipo: string
  url: string
  duration?: number
  onDone: () => void
}) {
  if (tipo === 'video') return <VideoPlayer src={url} onEnded={onDone} />
  if (tipo === 'image') return <ImageViewer src={url} duration={duration ?? 10} onDone={onDone} />
  if (tipo === 'pdf') return <PDFViewer src={url} duration={duration ?? 15} onDone={onDone} />
  if (tipo === 'excel') return <ExcelViewer src={url} duration={duration ?? 15} onDone={onDone} />
  if (tipo === 'office') return <OfficeViewer src={url} duration={duration ?? 20} onDone={onDone} />
  // Fallback genérico: exibe via iframe por N segundos
  return (
    <iframe
      className="w-full h-full"
      src={url}
      onLoad={() => setTimeout(onDone, (duration ?? 10) * 1000)}
    />
  )
}