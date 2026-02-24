import React, { useEffect } from 'react'

export default function TV() {
  // Tenta fullscreen após entrar
  useEffect(() => {
    const el = document.documentElement
    const tryFs = async () => {
      if (!document.fullscreenElement) {
        try { await el.requestFullscreen() } catch {}
      }
    }
    const id = setTimeout(tryFs, 500)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Padrão corporativo sutil no fundo */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #6366f1 1px, transparent 1px), radial-gradient(circle at 80% 80%, #14b8a6 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-white animate-fade">
        <div className="text-center">
          <div className="text-2xl font-semibold">Tela da TV</div>
          <div className="text-slate-300 mt-2">Aguardando integração com playlist e realtime…</div>
        </div>
      </div>
    </div>
  )
}
