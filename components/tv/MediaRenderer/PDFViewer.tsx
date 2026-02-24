import React, { useEffect } from 'react'

export default function PDFViewer({ src, duration, onDone }: { src: string; duration: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, (duration || 15) * 1000)
    return () => clearTimeout(t)
  }, [src, duration])
  return <iframe src={src} className="w-full h-full" />
}