import React, { useEffect, useRef } from 'react'

export default function VideoPlayer({ src, onEnded }: { src: string; onEnded: () => void }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => { ref.current?.play().catch(() => {}) }, [src])
  return (
    <video
      ref={ref}
      src={src}
      className="w-full h-full object-contain"
      autoPlay
      muted
      onEnded={onEnded}
      controls={false}
      playsInline
    />
  )
}