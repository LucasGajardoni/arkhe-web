import { API_URL } from '../config/api.js'
import { ErroApi } from './authService.js'

export async function criarIntegracao(nome) {
  let resposta

  try {
    resposta = await fetch(`${API_URL}/integracoes/api`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: String(nome || '').trim() }),
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor.', 0, {})
  }

  let resultado = {}
  try { resultado = await resposta.json() } catch { /* Resposta sem JSON. */ }

  if (!resposta.ok) {
    let mensagem = resultado.mensagem || 'Não foi possível autorizar a integração.'
    if (resposta.status === 401) mensagem = 'Sua sessão expirou. Entre novamente para continuar.'
    if (resposta.status === 403) mensagem = resultado.mensagem || 'Esta funcionalidade está disponível apenas para contas PJ.'
    throw new ErroApi(mensagem, resposta.status, resultado)
  }

  return resultado
}
