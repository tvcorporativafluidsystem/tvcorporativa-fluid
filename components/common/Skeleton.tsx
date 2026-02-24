import React from 'react'
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-800/60 rounded ${className}`} />
}