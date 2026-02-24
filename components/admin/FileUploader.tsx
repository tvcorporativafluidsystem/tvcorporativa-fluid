import React, { useState } from 'react'
import Card from '../common/Card'
import Spinner from '../common/Spinner'
import { detectType, insertFileRow, uploadToStorage } from '../../services/dataService'

export default function FileUploader({ onUploaded }: { onUploaded: () => void }) {
  const [progress, setProgress] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const f of Array.from(files)) {
      setStatus(`Enviando: ${f.name}`)
      setPreviewUrl(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
      setProgress(0)
      try {
        const tipo = detectType(f.name, f.type)
        const { publicUrl } = await uploadToStorage(f, setProgress)
        await insertFileRow(f, publicUrl, tipo)
      } catch (e: any) {
        setStatus(`Erro: ${e.message}`)
        console.error(e)
      }
    }
    setProgress(null)
    setStatus('Concluído')
    onUploaded()
  }

  return (
    <Card title="Upload de Arquivos" right={progress != null ? <Spinner /> : null}>
      <input className="input mb-3" type="file" multiple onChange={e => handleFiles(e.target.files)} />
      {progress != null && (
        <div className="w-full bg-slate-800 rounded h-2 overflow-hidden">
          <div className="h-2 bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {status && <p className="text-sm text-slate-400 mt-2">{status}</p>}
      {previewUrl && (
        <div className="mt-3">
          <p className="text-sm text-slate-400">Preview (quando aplicável):</p>
          <img src={previewUrl} className="max-h-48 rounded border border-slate-800 mt-1" onError={() => setPreviewUrl(null)} />
        </div>
      )}
      <p className="text-xs text-slate-500 mt-2">
        Suporta: MP4, MOV, AVI, WEBM, PDF, XLSX, PPTX, DOCX, JPG, PNG, e outros.
      </p>
    </Card>
  )
}
