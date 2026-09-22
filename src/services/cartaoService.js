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
