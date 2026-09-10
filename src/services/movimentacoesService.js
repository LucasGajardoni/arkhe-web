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

export function buscarCobrancaPorCodigo(codigoPagamento) {
  return requisitarMovimentacoes(
    '/buscar_cobranca_codigo',
    {
      method: 'POST',
      body: JSON.stringify({ codigo_pagamento: codigoPagamento }),
    },
    'Boleto não encontrado.',
  )
}

export async function buscarBoletoPdf(idCobranca) {
  let resposta

  try {
    resposta = await fetch(`${API_URL}/boleto_pdf/${encodeURIComponent(idCobranca)}`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/pdf' },
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor para obter o boleto.', 0, {})
  }

  if (!resposta.ok) {
    let resultado = {}
    try { resultado = await resposta.json() } catch { /* Resposta sem JSON. */ }

    let mensagem = resultado.mensagem || 'Não foi possível obter o PDF do boleto.'
    if (resposta.status === 401) mensagem = 'Sua sessão expirou. Entre novamente para continuar.'
    if (resposta.status === 404) mensagem = resultado.mensagem || 'Boleto não encontrado.'
    if (resposta.status === 403) mensagem = resultado.mensagem || 'Você não tem permissão para acessar este boleto.'

    throw new ErroApi(mensagem, resposta.status, resultado)
  }

  return resposta.blob()
}
