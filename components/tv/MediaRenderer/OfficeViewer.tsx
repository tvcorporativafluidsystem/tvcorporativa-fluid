import React, { useEffect, useMemo } from 'react'

export default function OfficeViewer({ src, duration, onDone }: { src: string; duration: number; onDone: () => void }) {
  const officeUrl = useMemo(
    () => `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(src)}`,
    [src]
  )
  useEffect(() => {
    const t = setTimeout(onDone, (duration || 20) * 1000)
    return () => clearTimeout(t)
  }, [officeUrl, duration])
  return <iframe src={officeUrl} className="w-full h-full" />
}