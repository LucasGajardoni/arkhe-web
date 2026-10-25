import { requisitarApi } from './authService.js'

export function listarNotificacoes({ limite = 100, deslocamento = 0 } = {}) {
  const parametros = new URLSearchParams({
    limite: String(limite),
    deslocamento: String(deslocamento),
  })

  return requisitarApi(`/api/v1/notificacoes?${parametros}`)
}

export const obterContadorNotificacoes = () =>
  requisitarApi('/api/v1/notificacoes/contador')

export const marcarNotificacaoComoLida = (id) =>
  requisitarApi(`/api/v1/notificacoes/${id}/lida`, { method: 'PATCH' })

export const obterPreferenciasNotificacoes = () =>
  requisitarApi('/api/v1/notificacoes/preferencias')

export const salvarPreferenciaNotificacao = (categoria, ativo) =>
  requisitarApi('/api/v1/notificacoes/preferencias', {
    method: 'PUT',
    dados: { [categoria]: ativo },
  })
