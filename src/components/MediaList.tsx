import { useCallback, useMemo, useRef, useState } from 'react'
import { reorderMidias } from '../services/mediaService'
import MediaRow from './MediaRow'
import { Midia } from '../types'

export default function MediaList({
  items,
  onChange
}: {
  items: Midia[]
  onChange: () => void
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const ordered = useMemo(() => items.slice().sort((a, b) => a.ordem - b.ordem), [items])

  const onDragStart = (idx: number) => setDragIndex(idx)

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    // Visual (opcional)
  }

  const onDrop = async (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIndex == null || dragIndex === idx) return
    const arr = ordered.slice()
    const [dragged] = arr.splice(dragIndex, 1)
    arr.splice(idx, 0, dragged)
    setDragIndex(null)
    // Persistir ordens
    await reorderMidias(arr.map((x) => x.id))
    onChange()
  }

  const dragHandleProps = useCallback(
    (idx: number) => ({
      draggable: true,
      onDragStart: () => onDragStart(idx),
      onDragOver: (e: React.DragEvent) => onDragOver(e, idx),
      onDrop: (e: React.DragEvent) => onDrop(e, idx)
    }),
    // 'ordered' é suficiente aqui para manter os handlers coerentes com a lista atual
    [ordered]
  )

  return (
    // relative + isolate evita que elementos com position/ z-index internos escapem do card
    // min-w-0 garante que o conteúdo interno (nome longo) possa truncar corretamente
    <div ref={listRef} className="relative isolate flex flex-col gap-3 min-w-0">
      {ordered.map((item, idx) => (
        // min-w-0 aqui garante truncamento adequado nos filhos (ex.: dentro do MediaRow)
        <div key={item.id} className="min-w-0">
          <MediaRow item={item} onChange={onChange} dragHandleProps={dragHandleProps(idx)} />
        </div>
      ))}
    </div>
  )
}