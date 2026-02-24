import React, { useState } from 'react'
import Card from '../common/Card'
import { publishNow, setEmergency } from '../../services/dataService'
import { usePresence } from '../../hooks/usePresence'

export default function BroadcastBar() {
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('Atenção')
  const [body, setBody] = useState('')
  const [theme, setTheme] = useState<'danger' | 'warning' | 'info'>('danger')
  const { count } = usePresence('tv-presence', 'admin')

  async function publish() {
    setBusy(true)
    try { await publishNow() } finally { setBusy(false) }
  }

  return (
    <Card title="Transmissão" right={<span className="text-sm text-slate-400">TVs online: {count}</span>}>
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        <button className="btn bg-emerald-600 hover:bg-emerald-500" disabled={busy} onClick={publish}>
          {busy ? 'Publicando...' : 'PUBLICAR TRANSMISSÃO'}
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <input className="input w-40" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="input w-72" placeholder="Mensagem de emergência" value={body} onChange={e => setBody(e.target.value)} />
          <select className="input w-36" value={theme} onChange={e => setTheme(e.target.value as any)}>
            <option value="danger">Perigo</option>
            <option value="warning">Alerta</option>
            <option value="info">Informação</option>
          </select>
          <button className="btn bg-red-600 hover:bg-red-500" onClick={() => setEmergency(true, title, body, theme)}>Ativar</button>
          <button className="btn-ghost" onClick={() => setEmergency(false)}>Limpar</button>
        </div>
      </div>
    </Card>
  )
}