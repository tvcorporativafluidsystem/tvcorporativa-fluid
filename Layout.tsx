// src/Layout.tsx
import React from 'react'
import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-3 p-3 border-b border-slate-800 bg-slate-950/80">
        <Link className="btn-ghost" to="/admin">/admin</Link>
        <Link className="btn-ghost" to="/tv">/tv</Link>
      </div>
      <Outlet />
    </div>
  )
}