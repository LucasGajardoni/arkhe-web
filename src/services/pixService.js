import { API_URL } from '../config/api.js'
import { ErroApi } from './authService.js'

function cabecalhosJson() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function requisitarPix(caminho, opcoes = {}) {
  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      credentials: 'include',
      ...opcoes,
      headers: { ...cabecalhosJson(), ...opcoes.headers },
    })
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor.', 0, {})
  }

  let resultado = {}
  try { resultado = await resposta.json() } catch { /* Resposta sem JSON. */ }

  if (!resposta.ok) {
    const naoAutenticado = resposta.status === 401
      || (resposta.status === 403 && /não logado|sessão|token/i.test(resultado.mensagem || ''))
    const mensagem = naoAutenticado
      ? 'Sua sessão expirou. Entre novamente para acessar o Pix.'
      : resultado.mensagem || 'Não foi possível concluir a operação Pix.'
    throw new ErroApi(mensagem, resposta.status, resultado)
  }

  return resultado
}

export function buscarChavesPix() {
  return requisitarPix('/chaves_pix')
}

export function adicionarChavePix(tipo, valor) {
  const campos = {
    email: 'chave_pix_email',
    telefone: 'chave_pix_telefone',
    cpf: 'chave_pix_cpf',
    aleatoria: 'chave_pix_aleatoria',
    cnpj: 'chave_pix_cnpj',
  }
  return requisitarPix('/adicionar_chave_pix', {
    method: 'POST',
    body: JSON.stringify({ [campos[tipo]]: tipo === 'aleatoria' ? true : valor }),
  })
}

export function excluirChavePix(idChavePix, tipo) {
  return requisitarPix(`/deletar_chave_pix/${idChavePix}`, {
    method: 'DELETE',
    body: JSON.stringify({ tipo }),
  })
}
