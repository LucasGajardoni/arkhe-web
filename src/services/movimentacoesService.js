import { API_URL } from '../config/api.js'
import { ErroApi } from './authService.js'

async function requisitarMovimentacoes(caminho, opcoes = {}, mensagemPadrao) {
  let resposta
  const headers = { ...opcoes.headers }
  if (opcoes.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      credentials: 'include',
      ...opcoes,
      headers,
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

function chaveIdempotencia() {
  return globalThis.crypto?.randomUUID?.()
    || `web-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`
}

export function cancelarCobranca(idCobranca, motivo) {
  return requisitarMovimentacoes(
    `/api/v1/cobrancas/${encodeURIComponent(idCobranca)}/cancelar`,
    {
      method: 'POST',
      body: JSON.stringify({ confirmacao: true, motivo, chave_idempotencia: chaveIdempotencia() }),
    },
    'Não foi possível cancelar a cobrança.',
  )
}

export function devolverMovimentacao(idMovimentacao, motivo) {
  return requisitarMovimentacoes(
    `/api/v1/movimentacoes/${encodeURIComponent(idMovimentacao)}/devolver`,
    {
      method: 'POST',
      body: JSON.stringify({ confirmacao: true, motivo, chave_idempotencia: chaveIdempotencia() }),
    },
    'Não foi possível devolver esta movimentação.',
  )
}

export function estornarBoleto(idMovimentacao, motivo) {
  return requisitarMovimentacoes(
    `/api/v1/movimentacoes/${encodeURIComponent(idMovimentacao)}/estornar`,
    {
      method: 'POST',
      body: JSON.stringify({ confirmacao: true, motivo, chave_idempotencia: chaveIdempotencia() }),
    },
    'Não foi possível estornar este boleto.',
  )
}

export function listarEstornosAdmin() {
  return requisitarMovimentacoes(
    '/api/v1/estornos/admin?limite=200',
    { method: 'GET' },
    'Não foi possível carregar o histórico administrativo.',
  )
}

export function consultarMigracaoEstornos() {
  return requisitarMovimentacoes(
    '/api/v1/estornos/admin/migracao',
    { method: 'GET' },
    'Não foi possível consultar a instalação da estrutura de estornos.',
  )
}

export function instalarMigracaoEstornos() {
  return requisitarMovimentacoes(
    '/api/v1/estornos/admin/migracao',
    { method: 'POST', body: JSON.stringify({ confirmacao: true }) },
    'Não foi possível criar o backup e instalar a estrutura de estornos.',
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

export async function buscarComprovantePdf(idMovimentacao) {
  let resposta

  try {
    resposta = await fetch(`${API_URL}/comprovante/${encodeURIComponent(idMovimentacao)}`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/pdf' },
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor para obter o comprovante.', 0, {})
  }

  if (!resposta.ok) {
    let resultado = {}
    try { resultado = await resposta.json() } catch { /* Resposta sem JSON. */ }

    let mensagem = resultado.mensagem || 'Não foi possível gerar o comprovante.'
    if (resposta.status === 401) mensagem = 'Sua sessão expirou. Entre novamente para continuar.'
    if (resposta.status === 403) mensagem = resultado.mensagem || 'Você não tem permissão para acessar este comprovante.'
    if (resposta.status === 404) mensagem = resultado.mensagem || 'Comprovante não encontrado.'
    if (resposta.status >= 500) mensagem = resultado.mensagem || 'O servidor não conseguiu gerar o comprovante.'

    throw new ErroApi(mensagem, resposta.status, resultado)
  }

  return resposta.blob()
}
