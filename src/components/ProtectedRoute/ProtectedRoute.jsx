import { Navigate, Outlet } from 'react-router-dom'
import { useSessao } from '../../hooks/useSessao.js'

export default function ProtectedRoute() {
  const { perfil, verificandoSessao } = useSessao()

  if (verificandoSessao) return null
  if (!perfil) return <Navigate to="/" replace />

  return <Outlet />
}
