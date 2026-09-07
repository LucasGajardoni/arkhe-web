import { useContext } from 'react'
import SessaoContext from '../contexts/SessaoContext.js'

export function useSessao() {
  const sessao = useContext(SessaoContext)

  if (!sessao) {
    throw new Error('useSessao precisa ser usado dentro de SessaoProvider.')
  }

  return sessao
}
