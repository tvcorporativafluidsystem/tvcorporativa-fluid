import { GripVertical, Eye, Trash2 } from 'lucide-react'
import Input from './ui/Input'
import Switch from './ui/Switch'
import Button from './ui/Button'
import { Midia } from '../types'
import { deleteMidia, toggleAtivo, updateMidia } from '../services/mediaService'
import { useState } from 'react'
import Modal from './ui/Modal'
import { officeEmbedUrl, isOffice } from '../utils/file'

export default function MediaRow({
  item,
  onChange,
  dragHandleProps
}: {
  item: Midia
  onChange: () => void
  dragHandleProps: any
}) {
  const [tempo, setTempo] = useState(item.tempo_exibicao)
  const [openPreview, setOpenPreview] = useState(false)

  async function persistTempo() {
    if (tempo !== item.tempo_exibicao) {
      await updateMidia(item.id, { tempo_exibicao: tempo })
      onChange()
    }
  }

  async function remove() {
    if (confirm(`Remover "${item.nome}"?`)) {
      await deleteMidia(item.id)
      onChange()
    }
  }

  async function toggle() {
    await toggleAtivo(item.id, !item.ativo)
    onChange()
  }

  const office = officeEmbedUrl(item.url, item.tipo)

  return (
    <>
      {/* 
        Layout responsivo:
        - Mobile: colunas empilham (sem sobrepor).
        - Desktop: duas regiões em linha; direita é nowrap e com larguras estáveis.
      */}
      <div className="w-full p-3 rounded-lg border border-[#1f2a44] bg-[#0f1523]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* BLOCO ESQUERDO: Drag + Thumb + Texto (elástico) */}
          <div className="flex flex-1 min-w-0 items-start md:items-center gap-3">
            <div className="hidden md:flex items-center justify-center text-muted cursor-grab" {...dragHandleProps}>
              <GripVertical size={18} />
            </div>

            <div className="w-16 h-10 rounded bg-black/40 overflow-hidden border border-[#1f2a44] flex-none">
              {item.tipo === 'image' && <img src={item.url} className="object-cover w-full h-full" />}
              {item.tipo === 'video' && <video src={item.url} className="object-cover w-full h-full" muted />}
              {item.tipo === 'audio' && (
                <div className="w-full h-full grid place-items-center text-xs text-muted">Áudio</div>
              )}
              {item.tipo === 'pdf' && (
                <div className="w-full h-full grid place-items-center text-xs text-muted">PDF</div>
              )}
              {isOffice(item.tipo) && (
                <div className="w-full h-full grid place-items-center text-xs text-muted">Office</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Nome completo: quebra linha quando precisar */}
              <p className="font-medium whitespace-normal break-words leading-snug" title={item.nome}>
                {item.nome}
              </p>
              <p className="text-xs text-muted uppercase">{item.tipo}</p>
            </div>
          </div>

          {/* BLOCO DIREITO: Tempo + Ativo + Ações (sempre visível) */}
          <div
            className="
              flex items-center md:justify-end gap-3
              flex-wrap md:flex-nowrap  /* quebra só no mobile */
              flex-none
            "
          >
            {/* Tempo */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted md:sr-only">Tempo (s)</label>
              <div className="w-[112px]">
                <Input
                  type="number"
                  min={1}
                  value={tempo}
                  onChange={(e) => setTempo(Math.max(1, Number(e.target.value)))}
                  onBlur={persistTempo}
                />
              </div>
            </div>

            {/* Ativo */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted md:sr-only">Ativo</label>
              <Switch checked={item.ativo} onChange={() => toggle()} />
            </div>

            {/* Ações: não encolhem, não somem */}
            <div className="flex items-center justify-end gap-2 flex-none shrink-0">
              <Button
                variant="ghost"
                onClick={() => setOpenPreview(true)}
                aria-label="Prévia"
                className="px-2 py-1"
                title="Prévia"
              >
                <Eye size={16} />
              </Button>

              <Button
                variant="ghost"
                onClick={remove}
                aria-label="Excluir"
                className="px-2 py-1"
                title="Excluir"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de prévia (inalterado) */}
      <Modal open={openPreview} onClose={() => setOpenPreview(false)} title={`Preview • ${item.nome}`}>
        <div className="aspect-video bg-black/40 rounded-lg overflow-hidden">
          {item.tipo === 'image' && <img src={item.url} className="object-contain w-full h-full" />}
          {item.tipo === 'video' && <video src={item.url} className="w-full h-full" controls autoPlay />}
          {item.tipo === 'audio' && <audio src={item.url} className="w-full" controls autoPlay />}
          {item.tipo === 'pdf' && <iframe src={item.url} className="w-full h-[70vh]" />}
          {isOffice(item.tipo) && office && <iframe src={office} className="w-full h-[70vh]" />}
          {isOffice(item.tipo) && !office && (
            <div className="p-4 text-sm text-muted">Não foi possível abrir o Office Viewer.</div>
          )}
        </div>
      </Modal>
    </>
  )
}