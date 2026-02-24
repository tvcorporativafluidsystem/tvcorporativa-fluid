import React, { useEffect, useMemo, useState } from 'react'
import Card from '../common/Card'
import Skeleton from '../common/Skeleton'
import { listFiles, listPlaylist } from '../../services/dataService'
import type { DBFile } from '../../types/db'

export default function FileList({ onAdd }: { onAdd: (file: DBFile) => void }) {
  const [files, setFiles] = useState<DBFile[]>([])
  const [inPlaylistIds, setInPlaylistIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [fs, pl] = await Promise.all([listFiles(), listPlaylist()])
    setFiles(fs)
    setInPlaylistIds(new Set(pl.map(p => p.file_id)))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const rows = useMemo(() => files, [files])

  return (
    <Card title="Arquivos Enviados" right={<button className="btn-ghost" onClick={load}>Recarregar</button>}>
      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      )}

      {!loading && rows.length === 0 && <p className="text-slate-400">Nenhum arquivo enviado.</p>}

      {!loading && rows.length > 0 && (
        <table className="table">
          <thead>
            <tr className="text-slate-400">
              <th className="text-left">Nome</th>
              <th>Tipo</th>
              <th>Tamanho</th>
              <th>Data</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(f => (
              <tr key={f.id} className="border-t border-slate-800">
                <td className="py-2">{f.nome}</td>
                <td className="text-center">{f.tipo}</td>
                <td className="text-center">{(f.tamanho / 1024 / 1024).toFixed(2)} MB</td>
                <td className="text-center">{new Date(f.created_at).toLocaleString()}</td>
                <td className="text-center">
                  {inPlaylistIds.has(f.id) ? <span className="text-green-400">Em playlist</span> : <span className="text-slate-400">Fora</span>}
                </td>
                <td className="text-right">
                  <button className="btn" onClick={() => { console.log('[FileList] clicado em adicionar', f); onAdd(f) }}>
                    Adicionar à playlist
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}