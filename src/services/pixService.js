import { API_URL } from '../config/api.js'
import { ErroApi } from './authService.js'

async function requisitarPix(caminho, opcoes = {}) {
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
    const naoAutenticado = resposta.status === 401
      || (resposta.status === 403 && /não logado|sessão expirada/i.test(resultado.mensagem || ''))
    let mensagem = resultado.mensagem || 'Não foi possível concluir a operação Pix.'
    if (naoAutenticado) mensagem = 'Sua sessão expirou. Entre novamente para acessar o Pix.'
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
  let valorEnviar = valor
  if (tipo === 'aleatoria') valorEnviar = true

  return requisitarPix('/adicionar_chave_pix', {
    method: 'POST',
    body: JSON.stringify({ [campos[tipo]]: valorEnviar }),
  })
}

export function excluirChavePix(idChavePix, tipo) {
  return requisitarPix(`/deletar_chave_pix/${idChavePix}`, {
    method: 'DELETE',
    body: JSON.stringify({ tipo }),
  })
}

export function realizarPix(tipoChave, chavePix, valor) {
  return requisitarPix('/adicionar_pix', {
    method: 'POST',
    body: JSON.stringify({
      tipo_chave: tipoChave,
      chave_pix: String(chavePix || '').trim(),
      valor,
    }),
  })
}
