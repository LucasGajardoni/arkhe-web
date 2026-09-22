import { Navigate, Outlet } from 'react-router-dom'
import { useSessao } from '../../hooks/useSessao.js'
import EstadoSessao from './EstadoSessao.jsx'

export default function ProtectedRoute() {
  const { perfil, usuarioIdentidade, trocaPinObrigatoria, verificandoSessao, erroSessao } = useSessao()
  if (verificandoSessao || erroSessao) return <EstadoSessao />
  if (!usuarioIdentidade) return <Navigate to="/login" replace />
  if (trocaPinObrigatoria) return <Navigate to="/primeiro-acesso" replace />
  if (!perfil) return <Navigate to="/selecionar-conta" replace />
  return <Outlet key={perfil.idConta} />
}
