import { API_URL } from '../config/api.js'
import { ErroApi } from './authService.js'

async function requisitarMovimentacoes(caminho, opcoes = {}, mensagemPadrao) {
  let resposta

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      credentials: 'include',
      ...opcoes,
      headers: { 'Content-Type': 'application/json', ...opcoes.headers },
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor.', 0, {})
  }

  let resultado = {}
  try { resultado = await resposta.json() } catch { /* Resposta sem JSON. */ }

  if (!resposta.ok) {
    throw new ErroApi(
      resultado.mensagem || mensagemPadrao,
      resposta.status,
      resultado,
    )
  }

  return resultado
}

export function buscarMovimentacoes() {
  return requisitarMovimentacoes(
    '/buscar_movimentacoes',
    { method: 'GET' },
    'Não foi possível buscar as movimentações.',
  )
}

export function pagarCobranca(idCobranca) {
  return requisitarMovimentacoes(
    '/baixar_cobranca',
    {
      method: 'POST',
      body: JSON.stringify({ id_cobranca: idCobranca }),
    },
    'Não foi possível pagar o boleto.',
  )
}
