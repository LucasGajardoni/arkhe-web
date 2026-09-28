import { somenteNumeros } from '../../utils/formatadores.js'

const cabecalhoModelo = ['cpf', 'nome', 'salario']

function campoCsv(valor) {
  const texto = String(valor ?? '')
  return /[",\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto
}

function montarCsv(linhas) {
  return `\uFEFF${linhas.map((linha) => linha.map(campoCsv).join(',')).join('\r\n')}\r\n`
}

export function conteudoModeloFuncionarios() {
  return montarCsv([
    cabecalhoModelo,
    ['12345678901', 'Ana Souza', '2500.00'],
    ['98765432100', 'Carlos Lima', '3200.00'],
  ])
}

export function conteudoExportacaoFuncionarios(funcionarios) {
  return montarCsv([
    [...cabecalhoModelo, 'status'],
    ...funcionarios.map((funcionario) => [
      somenteNumeros(funcionario.cpf),
      funcionario.nome,
      Number(funcionario.salario || 0).toFixed(2),
      Number(funcionario.status) === 1 ? 'ativo' : 'inativo',
    ]),
  ])
}

export function baixarCsv(nome, conteudo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const baixarModeloFuncionarios = () => baixarCsv('modelo_funcionarios_arkhe.csv', conteudoModeloFuncionarios())
export const exportarFuncionarios = (funcionarios) => baixarCsv('funcionarios_arkhe.csv', conteudoExportacaoFuncionarios(funcionarios))
