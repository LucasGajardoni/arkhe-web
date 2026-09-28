export const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const statusFolha = ['Rascunho', 'Validada', 'Processando', 'Paga', 'Pagamento parcial']
export const tonsFolha = ['neutro', 'positivo', 'pendente', 'positivo', 'pendente']
export const statusItem = ['Pendente', 'Pronto para pagar', 'Pago', 'Erro']
export const competencia = (folha) => `${meses[Number(folha.mes) - 1]} de ${folha.ano}`
export const idFolhaValido = (id) => /^[1-9]\d*$/.test(String(id)) && Number.isSafeInteger(Number(id))
export const possuiConta = (funcionario) => funcionario.possui_conta_arkhe === true || Number(funcionario.possui_conta_arkhe) === 1
export const podePagar = (folha) => Boolean(folha && [0, 1, 4].includes(Number(folha.status)) && Number(folha.quantidade_validos) > 0 && Number(folha.total_valido) > 0)

export function mensagemErroPagamento(erro) {
  let mensagem = erro.message || 'Não foi possível concluir o pagamento. Atualize a folha para conferir a situação.'
  const dados = erro.dados || {}
  const saldo = dados.saldo_disponivel ?? dados.saldo_atual ?? dados.saldo
  const total = dados.valor_folha ?? dados.total_folha ?? dados.total_valido ?? dados.valor_total ?? dados.total
  if (saldo != null && Number.isFinite(Number(saldo))) mensagem += ` Saldo disponível: ${moeda.format(Number(saldo))}.`
  if (total != null && Number.isFinite(Number(total))) mensagem += ` Valor da folha: ${moeda.format(Number(total))}.`
  return mensagem
}
