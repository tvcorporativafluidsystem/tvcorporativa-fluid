import React, { useEffect, useMemo, useState } from 'react'
import Card from '../common/Card'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DBFile } from '../../types/db'
import { publishNow, replacePlaylist } from '../../services/dataService'

function Row({ id, name, type, tempo, setTempo }: { id: string; name: string; type: string; tempo: number | null; setTempo: (v: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between border border-slate-800 rounded-lg p-3 bg-slate-900/60">
      <div className="flex items-center gap-3">
        <div className="cursor-grab select-none text-slate-400" {...attributes} {...listeners}>≡</div>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-slate-400">{type}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {type === 'video' ? (
          <span className="text-slate-400 text-sm">Tempo: —</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Tempo (s):</span>
            <input type="number" min={3} className="input w-24 text-center" value={tempo ?? 10} onChange={e => setTempo(parseInt(e.target.value || '10', 10))} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlaylistBoard() {
  type Item = { id: string; file: DBFile; tempo: number | null }
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    function addFromOutside(file: DBFile) {
      setItems(prev => {
        if (prev.find(i => i.file.id === file.id)) {
          console.log('[PlaylistBoard] já existe na playlist:', file.id, file.nome)
          return prev
        }
        console.log('[PlaylistBoard] adicionado:', { id: file.id, nome: file.nome, tipo: file.tipo })
        return [...prev, { id: file.id, file, tempo: file.tipo === 'video' ? null : 10 }]
      })
    }
    ;(window as any).playlistAdd = addFromOutside
    console.log('[PlaylistBoard] window.playlistAdd registrado')
    return () => { delete (window as any).playlistAdd; console.log('[PlaylistBoard] window.playlistAdd removido') }
  }, [])

  const sensors = useSensors(useSensor(PointerSensor))
  const ids = useMemo(() => items.map(i => i.id), [items])

  function onDragEnd(e: any) {
    const { active, over } = e
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      setItems(arrayMove(items, oldIndex, newIndex))
    }
  }
  function setTempo(id: string, v: number) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, tempo: v } : i)))
  }

  async function persist() {
    try {
      if (items.length === 0) {
        alert('A playlist está vazia. Adicione ao menos 1 item.')
        return
      }
      const payload = items.map((i, idx) => ({ file_id: i.file.id, ordem: idx + 1, tempo_exibicao: i.tempo }))
      console.log('[PlaylistBoard] Salvando payload:', payload)
      await replacePlaylist(payload)
      alert('Playlist salva com sucesso.')
    } catch (e: any) {
      console.error('[PlaylistBoard] Erro ao salvar playlist:', e)
      alert('Erro ao salvar playlist: ' + (e?.message || e))
    }
  }
  async function saveAndPublish() {
    try {
      await persist()
      console.log('[PlaylistBoard] Publicando…')
      await publishNow()
      alert('Transmissão publicada!')
    } catch (e: any) {
      console.error('[PlaylistBoard] Erro ao publicar:', e)
      alert('Erro ao publicar: ' + (e?.message || e))
    }
  }

  return (
    <Card title="Playlist (Drag & Drop)" right={<button className="btn-ghost" onClick={() => setItems([])}>Limpar</button>}>
      <div className="space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.length === 0 && <p className="text-slate-400">Nenhum item na playlist. Adicione à direita.</p>}
            {items.map(i => (
              <Row key={i.id} id={i.id} name={i.file.nome} type={i.file.tipo} tempo={i.tempo} setTempo={(v) => setTempo(i.id, v)} />
            ))}
          </SortableContext>
        </DndContext>
        <div className="flex items-center justify-end gap-3">
          <button className="btn" onClick={persist}>Salvar Playlist</button>
          <button className="btn bg-emerald-600 hover:bg-emerald-500" onClick={saveAndPublish}>PUBLICAR TRANSMISSÃO</button>
        </div>
      </div>
    </Card>
  )
}