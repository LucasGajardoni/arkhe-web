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

export function numeroTipoConta(tipoConta) {
  if (tipoConta === 'PJ' || tipoConta === 1 || tipoConta === '1') return 1
  return 0
}

function prepararPin(pin) {
  const pinLimpo = somenteNumeros(pin)

  if (!/^\d{6}$/.test(pinLimpo)) {
    throw new ErroApi('O PIN deve possuir exatamente 6 dígitos.', 0, {})
  }

  return pinLimpo
}

async function lerJson(resposta) {
  try {
    return await resposta.json()
  } catch {
    return {}
  }
}

async function requisitar(
  caminho,
  opcoes,
  mensagemConexao = 'Não foi possível conectar ao servidor. Confirme se o backend está ligado.',
) {
  try {
    return await fetch(`${API_URL}${caminho}`, opcoes)
  } catch {
    throw new ErroApi(mensagemConexao, 0, {})
  }
}

async function validarResposta(resposta, mensagemPadrao) {
  const resultado = await lerJson(resposta)

  if (!resposta.ok) {
    let mensagem = resultado.mensagem || mensagemPadrao

    if (resposta.status === 401 || resposta.status === 403) {
      mensagem = resultado.mensagem || 'Sua sessão expirou. Entre novamente para continuar.'
    }

    throw new ErroApi(mensagem, resposta.status, resultado)
  }

  return resultado
}

async function enviarJson(caminho, dados, mensagemPadrao) {
  const resposta = await requisitar(caminho, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })

  return validarResposta(resposta, mensagemPadrao)
}

async function enviarFormulario(caminho, metodo, dados, mensagemPadrao) {
  const resposta = await requisitar(caminho, {
    method: metodo,
    credentials: 'include',
    body: dados,
  })

  return validarResposta(resposta, mensagemPadrao)
}

export async function verificarUsuario(cpf) {
  const resultado = await enviarJson(
    '/verificar_usuario',
    { cpf: somenteNumeros(cpf) },
    'Não foi possível verificar o CPF.',
  )

  if (typeof resultado.usuario_existente !== 'boolean') {
    throw new ErroApi('O servidor retornou uma resposta inválida para a verificação do CPF.', 0, resultado)
  }

  return resultado
}

export function realizarLogin({ cpf, pin, tipoConta, cadastroFacial = false }) {
  return enviarJson(
    '/login',
    {
      cpf: somenteNumeros(cpf),
      pin: prepararPin(pin),
      tipo_conta: numeroTipoConta(tipoConta),
      cadastro_facial: cadastroFacial,
    },
    'Não foi possível entrar na conta.',
  )
}

function montarDadosCadastro(tipoConta, dadosPF, dadosPJ) {
  const empresarial = numeroTipoConta(tipoConta) === 1
  let dados = dadosPF
  let nome = dadosPF.nome
  let email = dadosPF.email
  let telefone = dadosPF.telefone
  let cpf = dadosPF.cpf
  let cnpj = ''
  let nomeFantasia = ''
  let razaoSocial = ''
  let representante = ''

  if (empresarial) {
    dados = dadosPJ
    nome = dadosPJ.nomeResponsavel
    email = dadosPJ.emailEmpresarial
    telefone = dadosPJ.telefoneEmpresarial
    cpf = dadosPJ.cpfResponsavel
    cnpj = dadosPJ.cnpj
    nomeFantasia = dadosPJ.nomeFantasia
    razaoSocial = dadosPJ.razaoSocial
    representante = dadosPJ.cpfResponsavel
  }

  const formData = new FormData()
  formData.append('nome', String(nome || '').trim())
  formData.append('email', String(email || '').trim().toLowerCase())
  formData.append('telefone', somenteNumeros(telefone))
  formData.append('cpf', somenteNumeros(cpf))
  formData.append('cnpj', somenteNumeros(cnpj))
  formData.append('pin', prepararPin(dados.pin))
  formData.append('tipo_conta', String(numeroTipoConta(tipoConta)))
  formData.append('cep', somenteNumeros(dados.cep))
  formData.append('rua', String(dados.logradouro || '').trim())
  formData.append('numero', String(dados.numero || '').trim())
  formData.append('bairro', String(dados.bairro || '').trim())
  formData.append('cidade', String(dados.cidade || '').trim())
  formData.append('estado', String(dados.estado || '').trim())
  formData.append('complemento', String(dados.complemento || '').trim())
  formData.append('nome_fantasia', String(nomeFantasia || '').trim())
  formData.append('razao_social', String(razaoSocial || '').trim())
  formData.append('representante', somenteNumeros(representante))
  formData.append('tipo', '1')

  return formData
}

export function cadastrarUsuario({ tipoConta, dadosPF, dadosPJ }) {
  const formData = montarDadosCadastro(tipoConta, dadosPF, dadosPJ)
  return enviarFormulario(
    '/adicionar_usuario',
    'POST',
    formData,
    'Não foi possível realizar o cadastro.',
  )
}

export function adicionarConta({
  tipoConta,
  pin,
  cnpj = '',
  nomeFantasia = '',
  razaoSocial = '',
  representante = '',
}) {
  const tipoContaNumero = numeroTipoConta(tipoConta)
  const formData = new FormData()

  formData.append('tipo_conta', String(tipoContaNumero))
  formData.append('pin', prepararPin(pin))

  if (tipoContaNumero === 1) {
    formData.append('cnpj', somenteNumeros(cnpj))
    formData.append('nome_fantasia', String(nomeFantasia || '').trim())
    formData.append('razao_social', String(razaoSocial || '').trim())
    formData.append('representante', somenteNumeros(representante))
  }

  return enviarFormulario(
    '/adicionar_conta',
    'POST',
    formData,
    'Não foi possível abrir a nova conta.',
  )
}

export function editarUsuario({ nome, email, telefone, cpf }) {
  const formData = new FormData()
  formData.append('nome', String(nome || '').trim())
  formData.append('email', String(email || '').trim().toLowerCase())
  formData.append('telefone', somenteNumeros(telefone))
  formData.append('cpf', somenteNumeros(cpf))

  return enviarFormulario(
    '/edicao_usuario',
    'PUT',
    formData,
    'Não foi possível salvar as alterações.',
  )
}

export async function encerrarSessao() {
  const resposta = await requisitar('/logout', {
    method: 'POST',
    credentials: 'include',
  })

  return validarResposta(resposta, 'Não foi possível sair da conta.')
}
