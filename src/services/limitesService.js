import { requisitarApi } from './authService.js'

export const obterLimitesConta = () => requisitarApi('/api/v1/limites')

export const obterConfiguracaoLimitesConta = () =>
  requisitarApi('/api/v1/limites/conta/configuracao')

export const atualizarConfiguracaoLimitesConta = (dados) =>
  requisitarApi('/api/v1/limites/conta/configuracao', { method: 'PUT', dados })

export const listarPoliticasLimites = () =>
  requisitarApi('/api/v1/limites/admin/politicas')

export const atualizarPoliticasLimites = (dados) =>
  requisitarApi('/api/v1/limites/admin/politicas', { method: 'PUT', dados })

export const listarHistoricoLimites = () =>
  requisitarApi('/api/v1/limites/admin/historico?limite=30')

export const listarCartoesLimitesAdmin = () =>
  requisitarApi('/api/v1/limites/admin/cartoes?limite=100')

export const atualizarLimiteCreditoCartao = (idCartao, dados) =>
  requisitarApi(`/api/v1/limites/admin/cartoes/${idCartao}`, { method: 'PUT', dados })

export const listarHistoricoLimitesCartoes = () =>
  requisitarApi('/api/v1/limites/admin/cartoes/historico?limite=30')
