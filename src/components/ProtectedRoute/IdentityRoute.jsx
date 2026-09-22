import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessao } from '../../hooks/useSessao.js'
import EstadoSessao from './EstadoSessao.jsx'

export default function IdentityRoute() {
  const { usuarioIdentidade, trocaPinObrigatoria, verificandoSessao, erroSessao } = useSessao()
  const { pathname } = useLocation()
  if (verificandoSessao || erroSessao) return <EstadoSessao />
  if (!usuarioIdentidade) return <Navigate to="/login" replace />
  if (trocaPinObrigatoria && pathname !== '/primeiro-acesso') return <Navigate to="/primeiro-acesso" replace />
  if (!trocaPinObrigatoria && pathname === '/primeiro-acesso') return <Navigate to="/selecionar-conta" replace />
  return <Outlet />
}
