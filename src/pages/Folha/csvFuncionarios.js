import { somenteNumeros } from '../../utils/formatadores.js'

const cabecalhoModelo = ['CPF', 'Nome completo', 'Salário mensal']
const SEPARADOR_CSV = ';'

function campoCsv(valor) {
  const texto = String(valor ?? '')
  return /[";\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto
}

function cpfParaExcel(valor) {
  const cpf = somenteNumeros(valor)
  return cpf ? `="${cpf}"` : ''
}

function textoSeguroExcel(valor) {
  const texto = String(valor ?? '')
  return /^[=+\-@]/.test(texto) ? `'${texto}` : texto
}

function montarCsv(linhas) {
  return `\uFEFFsep=;\r\n${linhas.map((linha) => linha.map(campoCsv).join(SEPARADOR_CSV)).join('\r\n')}\r\n`
}

function salarioCsv(valor) {
  return Number(valor || 0).toFixed(2).replace('.', ',')
}

export function conteudoModeloFuncionarios() {
  return montarCsv([
    cabecalhoModelo,
    [cpfParaExcel('12345678901'), 'Ana Souza', '2500,00'],
    [cpfParaExcel('98765432100'), 'Carlos Lima', '3200,00'],
  ])
}

export function conteudoExportacaoFuncionarios(funcionarios) {
  return montarCsv([
    [...cabecalhoModelo, 'Status'],
    ...funcionarios.map((funcionario) => [
      cpfParaExcel(funcionario.cpf),
      textoSeguroExcel(funcionario.nome),
      salarioCsv(funcionario.salario),
      Number(funcionario.status) === 1 ? 'Ativo' : 'Inativo',
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
