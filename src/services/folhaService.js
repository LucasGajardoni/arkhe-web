import { requisitarApi } from './authService.js'
import { somenteNumeros } from '../utils/formatadores.js'

export const listarFuncionarios = () => requisitarApi('/listar_funcionarios')
export const listarFolhas = () => requisitarApi('/listar_folhas')
export const adicionarFuncionario = ({ cpf, nome, salario }) => requisitarApi('/adicionar_funcionario', {
  method: 'POST', dados: { cpf: somenteNumeros(cpf), nome: nome.trim(), salario: Number(salario) },
})
export const editarFuncionario = ({ id_funcionario, nome, salario }) => requisitarApi('/editar_funcionario', {
  method: 'PUT', dados: { id_funcionario, nome: nome.trim(), salario: Number(salario) },
})
export const alterarStatusFuncionario = (idFuncionario, status) => requisitarApi('/alterar_status_funcionario', {
  method: 'PUT', dados: { id_funcionario: idFuncionario, status: Number(status) },
})
export const criarFolha = (mes, ano) => requisitarApi('/criar_folha', {
  method: 'POST', dados: { mes: Number(mes), ano: Number(ano) },
})
export const buscarFolha = (idFolha) => requisitarApi(`/folha/${encodeURIComponent(idFolha)}`)
export const revalidarFolha = (idFolha) => requisitarApi('/revalidar_folha', {
  method: 'POST', dados: { id_folha: Number(idFolha) },
})
export const pagarFolha = (idFolha) => requisitarApi('/pagar_folha', {
  method: 'POST', dados: { id_folha: Number(idFolha) },
})
