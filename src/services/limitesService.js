import { requisitarApi } from './authService.js'

export const obterLimitesConta = () => requisitarApi('/api/v1/limites')

export const listarPoliticasLimites = () =>
  requisitarApi('/api/v1/limites/admin/politicas')

export const atualizarPoliticasLimites = (dados) =>
  requisitarApi('/api/v1/limites/admin/politicas', { method: 'PUT', dados })

export const listarHistoricoLimites = () =>
  requisitarApi('/api/v1/limites/admin/historico?limite=30')
