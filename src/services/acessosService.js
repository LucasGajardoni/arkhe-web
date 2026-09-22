import { requisitarApi } from './authService.js'
import { somenteNumeros } from '../utils/formatadores.js'

export const verificarUsuarioParaAcesso = (cpf) => requisitarApi('/acessos/verificar_usuario', {
  method: 'POST', dados: { cpf: somenteNumeros(cpf) },
})
export const convidarAcesso = (dados) => requisitarApi('/acessos/convidar', { method: 'POST', dados })
export const listarAcessos = () => requisitarApi('/acessos')
export const listarConvitesPendentes = () => requisitarApi('/convites_pendentes')
export const aceitarConvite = (id) => requisitarApi(`/convites/${id}/aceitar`, { method: 'POST' })
export const recusarConvite = (id) => requisitarApi(`/convites/${id}/recusar`, { method: 'POST' })
export const alterarCargo = (id, cargo) => requisitarApi(`/acessos/${id}/cargo`, { method: 'PUT', dados: { cargo: Number(cargo) } })
export const bloquearAcesso = (id) => requisitarApi(`/acessos/${id}/bloquear`, { method: 'PUT' })
export const ativarAcesso = (id) => requisitarApi(`/acessos/${id}/ativar`, { method: 'PUT' })
export const revogarAcesso = (id) => requisitarApi(`/acessos/${id}`, { method: 'DELETE' })
export const reenviarConvite = (id) => requisitarApi(`/acessos/${id}/reenviar-convite`, { method: 'POST' })
