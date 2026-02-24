import React from 'react'

export default function Card({
  title,
  right,
  children
}: { title?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        {title ? <h3 className="text-lg font-semibold">{title}</h3> : <span />}
        {right}
      </div>
      {children}
    </div>
  )
}