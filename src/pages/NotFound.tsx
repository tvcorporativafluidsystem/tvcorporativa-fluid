export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h2 className="text-3xl font-bold">404</h2>
        <p className="text-muted mt-2">Página não encontrada.</p>
        <a className="text-primary-700 underline mt-4 inline-block" href="/admin">Ir para o Admin</a>
      </div>
    </div>
  )
}