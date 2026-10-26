import { requisitarApi } from './authService.js'
import { API_URL } from '../config/api.js'

export const obterResumoAdminBanco = () => requisitarApi('/api/v1/admin/banco/resumo')
export const obterPermissaoAdminBanco = () => requisitarApi('/api/v1/admin/banco/permissao')

export const perguntarMauroAdmin = (pergunta, historico = []) => requisitarApi(
  '/api/v1/admin/banco/assistente',
  { method: 'POST', dados: { pergunta, historico } },
)

export const buscarUsuariosAdminBanco = (termo) =>
  requisitarApi(`/api/v1/admin/banco/usuarios?q=${encodeURIComponent(termo)}`)

export const obterDetalheUsuarioAdminBanco = (idUsuario) =>
  requisitarApi(`/api/v1/admin/banco/usuarios/${encodeURIComponent(idUsuario)}`)

export const listarOperacoesAdminBanco = (filtros = {}) => {
  const parametros = new URLSearchParams()
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(chave, valor)
  })
  const query = parametros.toString()
  return requisitarApi(`/api/v1/admin/banco/operacoes${query ? `?${query}` : ''}`)
}

export const obterStatusAuditoriaAdmin = () => requisitarApi('/api/v1/admin/auditoria/status')

export const listarEventosAuditoriaAdmin = (filtros = {}) => {
  const parametros = new URLSearchParams()
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(chave, valor)
  })
  const query = parametros.toString()
  return requisitarApi(`/api/v1/admin/auditoria${query ? `?${query}` : ''}`)
}

export const obterEventoAuditoriaAdmin = (idEvento) =>
  requisitarApi(`/api/v1/admin/auditoria/${encodeURIComponent(idEvento)}`)

export const urlStreamAuditoriaAdmin = () => `${API_URL}/api/v1/admin/auditoria/stream`
