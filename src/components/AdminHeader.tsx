import { Monitor, TvMinimalPlay } from 'lucide-react'

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur border-b border-[#1f2a44] bg-bg/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TvMinimalPlay className="text-primary-700" />
          <h1 className="font-semibold">TV Corporativa • Admin</h1>
          <span className="text-muted text-sm">Fluid System</span>
        </div>
        <a
          href="/tv"
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
        >
          <Monitor size={18} />
          Abrir TV
        </a>
      </div>
    </header>
  )
}