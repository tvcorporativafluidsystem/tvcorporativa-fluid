import React from 'react'
import { Link } from 'react-router-dom'
import BroadcastBar from '../components/admin/BroadcastBar'
import FileUploader from '../components/admin/FileUploader'
import FileList from '../components/admin/FileList'
import PlaylistBoard from '../components/admin/PlaylistBoard'

export default function Admin() {
  function handleAddToPlaylist(file: any) {
    (window as any).playlistAdd?.(file)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="title">Administração — TV Corporativa</h1>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="btn-ghost text-slate-300" to="/admin">/admin</Link>
            <Link className="btn-ghost text-slate-300" to="/tv">/tv</Link>
          </nav>
        </header>

        <BroadcastBar />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FileUploader onUploaded={() => { /* opcional: feedback */ }} />
          <PlaylistBoard />
        </div>

        <FileList onAdd={handleAddToPlaylist} />
      </div>
    </div>
  )
}