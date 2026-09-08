import { API_URL } from '../config/api.js'
import { ErroApi } from './authService.js'

export async function buscarMovimentacoes() {
  let resposta

  try {
    resposta = await fetch(`${API_URL}/buscar_movimentacoes`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor.', 0, {})
  }

  let resultado = {}
  try { resultado = await resposta.json() } catch { /* Resposta sem JSON. */ }

  if (!resposta.ok) {
    throw new ErroApi(
      resultado.mensagem || 'Não foi possível buscar as movimentações.',
      resposta.status,
      resultado,
    )
  }

  return resultado
}
