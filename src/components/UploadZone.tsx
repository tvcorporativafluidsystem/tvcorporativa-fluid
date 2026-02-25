import { useRef, useState } from 'react'
import Button from './ui/Button'
import Progress from './ui/Progress'
import { uploadToStorage, insertMidia, listMidias } from '../services/mediaService'
import { inferTipoByNameOrMime } from '../utils/file'
import Toast, { useToast } from './Toast'

export default function UploadZone({ onUploaded }: { onUploaded: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const { show, state, reset } = useToast()

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    setProgress(1)
    setUploading(true)

    try {
      // Upload sequencial com feedback
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // 1) Envia para o Storage
        const { publicUrl } = await uploadToStorage(file)

        // 2) Infere tipo e registra no banco
        const tipo = inferTipoByNameOrMime(file.name, file.type)
        await insertMidia({
          nome: file.name,
          tipo,
          url: publicUrl,
          tempo_exibicao: tipo === 'video' || tipo === 'audio' ? 10 : 8,
          ordem: 9999, // vai pro final
          ativo: true
        })

        // 3) Progresso
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      // Pré-aquecimento local da lista e refresh do painel
      await listMidias()
      show('Upload concluído!')
      onUploaded()
    } catch (e: any) {
      console.error('[UploadZone] erro:', e)
      show(`Erro ao enviar: ${e?.message || e}`, 'error')
    } finally {
      // 🔑 Permite selecionar o MESMO arquivo novamente (força novo onChange)
      if (inputRef.current) inputRef.current.value = ''
      setTimeout(() => setProgress(0), 800)
      setUploading(false)
    }
  }

  return (
    <>
      <div
        className="flex flex-col items-center justify-center border-2 border-dashed border-[#1f2a44] rounded-xl p-8 bg-card/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onFilesSelected(e.dataTransfer.files)
        }}
      >
        <p className="text-muted mb-4">Arraste arquivos aqui ou</p>
        <div className="flex gap-3">
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Enviando…' : 'Selecionar Arquivos'}
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => onFilesSelected(e.target.files)}
          accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mp3,.pdf,.docx,.xlsx,.pptx"
        />

        {progress > 0 && (
          <div className="w-full max-w-md mt-6">
            <Progress value={progress} />
            <p className="text-xs text-muted mt-2">{progress}%</p>
          </div>
        )}
      </div>

      {/* 🔔 Render real do Toast */}
      {state && <Toast message={state.message} type={state.type} onClose={reset} />}
    </>
  )
}