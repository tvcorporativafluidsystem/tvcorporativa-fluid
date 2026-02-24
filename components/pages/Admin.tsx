import React from 'react'
import { Link } from 'react-router-dom'
import BroadcastBar from '../components/admin/BroadcastBar'
import FileUploader from '../components/admin/FileUploader'
import FileList from '../components/admin/FileList'
import PlaylistBoard from '../components/admin/PlaylistBoard'

export default function Admin() {
  // Função que recebe o arquivo selecionado em "Adicionar à playlist"
  function handleAddToPlaylist(file: any) {
    console.log('[Admin] add to playlist:', file?.nome || file?.id)
    if (typeof (window as any).playlistAdd !== 'function') {
      console.warn('[Admin] window.playlistAdd AUSENTE — PlaylistBoard ainda não montou')
      alert('A área da playlist ainda não carregou. Recarregue a página.')
      return
    }
    ;(window as any).playlistAdd(file)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Cabeçalho */}
        <header className="flex items-center justify-between">
          <h1 className="title">Administração — TV Corporativa</h1>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="btn-ghost text-slate-300" to="/admin">/admin</Link>
            <Link className="btn-ghost text-slate-300" to="/tv">/tv</Link>
          </nav>
        </header>

        {/* Barra de transmissão */}
        <BroadcastBar />

        {/* Área de Upload + Playlist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FileUploader onUploaded={() => {
            console.log('[Admin] Upload finalizado, você pode clicar em "Recarregar".')
          }} />

          <PlaylistBoard />
        </div>

        {/* Arquivos Enviados */}
        <FileList onAdd={handleAddToPlaylist} />

      </div>
    </div>
  )
}