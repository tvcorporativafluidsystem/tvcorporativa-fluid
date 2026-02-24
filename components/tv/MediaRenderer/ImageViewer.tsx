import React, { useEffect } from 'react'

export default function ImageViewer({ src, duration, onDone }: { src: string; duration: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, (duration || 10) * 1000)
    return () => clearTimeout(t)
  }, [src, duration])
  return <img src={src} className="w-full h-full object-contain" />
}