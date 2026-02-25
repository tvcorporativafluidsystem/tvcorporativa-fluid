import { useEffect, useRef, useState } from 'react'

export default function SafeIframe({
  sources,
  className,
  title = 'embed',
  timeoutMs = 4500
}: {
  sources: string[]
  className?: string
  title?: string
  timeoutMs?: number
}) {
  const [idx, setIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setLoaded(false)
    if (timerRef.current) window.clearTimeout(timerRef.current)

    timerRef.current = window.setTimeout(() => {
      if (!loaded && idx < sources.length - 1) {
        setIdx((i) => i + 1)
      }
    }, timeoutMs)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [idx, sources, loaded, timeoutMs])

  return (
    <div className="w-full h-full relative bg-white">
      <iframe
        key={sources[idx]}
        src={sources[idx]}
        className={className || 'w-full h-full'}
        title={title}
        onLoad={() => setLoaded(true)}
        allow="autoplay; fullscreen; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
      />
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center bg-black/30 text-white text-sm">
          Abrindo visualização…
        </div>
      )}
    </div>
  )
}