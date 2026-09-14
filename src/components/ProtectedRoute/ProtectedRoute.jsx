import { Navigate, Outlet } from 'react-router-dom'
import { useSessao } from '../../hooks/useSessao.js'

export default function ProtectedRoute() {
  const { perfil, verificandoSessao } = useSessao()

  if (verificandoSessao) {
    return (
      <main className="estado-sessao" role="status" aria-live="polite">
        <span />
        <strong>Verificando sua sessão...</strong>
      </main>
    )
  }
  if (!perfil) return <Navigate to="/" replace />

  return <Outlet />
}
