import { ErroApi, requisitarApi } from './authService.js'

function validarCartao(resultado) {
  if (typeof resultado.possui_cartao !== 'boolean'
    || (resultado.possui_cartao && (!resultado.cartao || resultado.cartao.id_conta == null))) {
    throw new ErroApi('Não foi possível confirmar os dados do cartão. Tente novamente.', 0, {})
  }
  return resultado
}

export async function buscarCartao() {
  return validarCartao(await requisitarApi('/cartao'))
}

export async function gerarCartao(dados = {}) {
  const resultado = validarCartao(await requisitarApi('/adicionar_cartao', { method: 'POST', dados }))
  if (!resultado.possui_cartao) throw new ErroApi('O servidor não confirmou a criação do cartão.', 0, {})
  return resultado
}


export async function buscarComprasCartao() {
  const resultado = await requisitarApi('/cartao/compras')
  if (!Array.isArray(resultado?.compras) || !Array.isArray(resultado?.parcelas) || !resultado?.resumo) {
    throw new ErroApi('Não foi possível carregar as compras do cartão.', 0, {})
  }
  return resultado
}


export async function buscarFaturasCartao() {
  const resultado = await requisitarApi('/cartao/faturas')
  if (!Array.isArray(resultado?.faturas) || !Array.isArray(resultado?.proximas_faturas)) {
    throw new ErroApi('Não foi possível carregar as faturas do cartão.', 0, {})
  }
  return resultado
}


export async function alterarBloqueioCartao(bloqueado) {
  const resultado = await requisitarApi('/bloquear_cartao', {
    method: 'PUT',
    dados: { bloqueado: Boolean(bloqueado) },
  })
  if (![0, 1].includes(Number(resultado?.status))) {
    throw new ErroApi('Não foi possível confirmar o novo status do cartão.', 0, {})
  }
  return resultado
}
