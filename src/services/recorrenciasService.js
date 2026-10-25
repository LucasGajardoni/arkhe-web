import { requisitarApi } from './authService.js'

export const listarRecorrencias = () => requisitarApi('/api/v1/recorrencias')

export const criarRecorrencia = (dados) => requisitarApi(
  '/api/v1/recorrencias',
  { method: 'POST', dados },
)

export const atualizarRecorrencia = (id, dados) => requisitarApi(
  `/api/v1/recorrencias/${encodeURIComponent(id)}`,
  { method: 'PUT', dados },
)

export const pausarRecorrencia = (id) => requisitarApi(
  `/api/v1/recorrencias/${encodeURIComponent(id)}/pausar`,
  { method: 'PATCH', dados: {} },
)

export const reativarRecorrencia = (id) => requisitarApi(
  `/api/v1/recorrencias/${encodeURIComponent(id)}/reativar`,
  { method: 'PATCH', dados: {} },
)

export const cancelarRecorrencia = (id) => requisitarApi(
  `/api/v1/recorrencias/${encodeURIComponent(id)}/cancelar`,
  { method: 'PATCH', dados: {} },
)
