import { API_URL } from '../config/api.js'
import { somenteNumeros } from '../utils/formatadores.js'

export class ErroApi extends Error {
  constructor(message, status, dados) {
    super(message)
    this.name = 'ErroApi'
    this.status = status
    this.dados = dados
  }
}

async function lerJson(resposta) {
  try {
    return await resposta.json()
  } catch {
    return {}
  }
}

async function requisitar(url, opcoes, mensagemConexao = 'Não foi possível conectar ao servidor. Confirme se o backend está ligado.') {
  try {
    return await fetch(url, opcoes)
  } catch {
    throw new ErroApi(mensagemConexao, 0, {})
  }
}

async function enviarJson(caminho, dados, mensagemPadrao) {
  const resposta = await requisitar(`${API_URL}${caminho}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
  const resultado = await lerJson(resposta)

  if (!resposta.ok) {
    throw new ErroApi(resultado.mensagem || mensagemPadrao, resposta.status, resultado)
  }

  return resultado
}

export async function realizarLogin({ cpf, senha, cadastroFacial = false }) {
  return enviarJson('/login', {
      cpf: somenteNumeros(cpf),
      senha,
      cadastro_facial: cadastroFacial,
  }, 'Não foi possível entrar na conta.')
}

export function solicitarCodigoRecuperacao(email) {
  return enviarJson('/esqueci_senha', { email }, 'Não foi possível enviar o código.')
}

export function verificarCodigoRecuperacao({ email, codigo }) {
  return enviarJson('/verificar_codigo', { email, codigo }, 'Não foi possível verificar o código.')
}

export function trocarSenha({ email, codigo, novaSenha }) {
  return enviarJson('/trocar_senha', {
    email,
    codigo,
    nova_senha: novaSenha,
  }, 'Não foi possível alterar a senha.')
}

export function verificarEmailCadastro(email) {
  return enviarJson('/verificar_email_cadastro', {
    email: String(email || '').trim().toLowerCase(),
  }, 'Não foi possível verificar o e-mail.')
}

export async function editarUsuario({ idUsuario, nome, email, telefone, cpf }) {
  const formData = new FormData()
  const token = localStorage.getItem('token')
  formData.append('nome', String(nome || '').trim())
  formData.append('email', String(email || '').trim().toLowerCase())
  formData.append('telefone', somenteNumeros(telefone))
  formData.append('cpf', somenteNumeros(cpf))

  const resposta = await requisitar(`${API_URL}/edicao_usuario/${idUsuario}`, {
    method: 'PUT',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }, 'Não foi possível salvar as alterações. Confirme se o backend está ligado.')
  const resultado = await lerJson(resposta)

  if (!resposta.ok) {
    const mensagem = resposta.status === 403
      ? 'Sua sessão expirou. Saia e entre novamente para editar seus dados.'
      : resultado.mensagem || 'Não foi possível editar o usuário.'
    throw new ErroApi(mensagem, resposta.status, resultado)
  }

  return resultado
}

function montarDadosCadastro(tipoConta, dadosPF, dadosPJ) {
  const empresarial = tipoConta === 'PJ'
  const dados = empresarial ? dadosPJ : dadosPF
  const formData = new FormData()

  formData.append('nome', empresarial ? dadosPJ.nomeResponsavel : dadosPF.nome)
  formData.append('email', empresarial ? dadosPJ.emailEmpresarial : dadosPF.email)
  formData.append('telefone', somenteNumeros(empresarial ? dadosPJ.telefoneEmpresarial : dadosPF.telefone))
  formData.append('cpf', somenteNumeros(empresarial ? dadosPJ.cpfResponsavel : dadosPF.cpf))
  formData.append('cnpj', empresarial ? somenteNumeros(dadosPJ.cnpj) : '')
  formData.append('senha', dados.senha)
  formData.append('data_nascimento', empresarial ? dadosPJ.dataNascimentoResponsavel : dadosPF.dataNascimento)
  formData.append('cep', somenteNumeros(dados.cep))
  formData.append('rua', dados.logradouro)
  formData.append('numero', dados.numero)
  formData.append('bairro', dados.bairro)
  formData.append('cidade', dados.cidade)
  formData.append('estado', dados.estado)
  formData.append('complemento', dados.complemento)
  formData.append('nome_fantasia', empresarial ? dadosPJ.nomeFantasia : '')
  formData.append('razao_social', empresarial ? dadosPJ.razaoSocial : '')
  formData.append('representante', empresarial ? somenteNumeros(dadosPJ.cpfResponsavel) : '')
  formData.append('tipo', '1')

  return formData
}

export async function cadastrarUsuario({ tipoConta, dadosPF, dadosPJ }) {
  const resposta = await requisitar(`${API_URL}/adicionar_usuario`, {
    method: 'POST',
    credentials: 'include',
    body: montarDadosCadastro(tipoConta, dadosPF, dadosPJ),
  })
  const resultado = await lerJson(resposta)

  if (!resposta.ok) {
    throw new ErroApi(resultado.mensagem || 'Não foi possível realizar o cadastro.', resposta.status, resultado)
  }

  return resultado
}
