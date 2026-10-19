import { API_URL } from '../config/api.js'
import { ErroApi } from './authService.js'

async function requisitarWhatsApp(caminho, opcoes = {}) {
  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { credentials: 'include', ...opcoes })
  } catch {
    throw new ErroApi('Não foi possível conectar ao Arkhé.', 0, {})
  }

  let dados = {}
  try { dados = await resposta.json() } catch { /* Resposta sem JSON. */ }
  if (!resposta.ok) throw new ErroApi(dados.mensagem || 'Não foi possível concluir a solicitação.', resposta.status, dados)
  return dados
}

export function consultarWhatsApp() {
  return requisitarWhatsApp('/whatsapp/configuracao')
}

export function atualizarWhatsApp(nivel) {
  return requisitarWhatsApp('/whatsapp/configuracao', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nivel }),
  })
}

export function gerarCodigoWhatsApp() {
  return requisitarWhatsApp('/whatsapp/codigo', { method: 'POST' })
}
