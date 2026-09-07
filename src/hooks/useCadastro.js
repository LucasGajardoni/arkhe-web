import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adicionarConta, cadastrarUsuario } from '../services/authService.js'
import { consultarEnderecoPorCep } from '../services/cepService.js'
import { prepararSessaoFacialCadastro } from '../services/facialService.js'
import { useSessao } from './useSessao.js'
import {
  mascaraCep,
  mascaraCnpj,
  mascaraCpf,
  mascaraTelefone,
  somenteNumeros,
} from '../utils/formatadores.js'
import {
  camposPreenchidos,
  cnpjValido,
  cpfValido,
  emailValido,
  maiorDeIdade,
  nomeValido,
  pinSeguro,
  pinValido,
} from '../utils/validadores.js'

const FLUXOS_CADASTRO = {
  novoPF: [
    { id: 'pessoais', nome: 'Dados pessoais', titulo: 'Vamos começar pelos seus dados' },
    { id: 'contato', nome: 'Contato', titulo: 'Como podemos falar com você?' },
    { id: 'endereco', nome: 'Endereço', titulo: 'Onde você mora?' },
    { id: 'acesso', nome: 'PIN', titulo: 'Crie o PIN da sua conta' },
    { id: 'revisao', nome: 'Revisão', titulo: 'Revise seus dados' },
    { id: 'facial', nome: 'Reconhecimento facial', titulo: 'Cadastre seu rosto' },
  ],
  novoPJ: [
    { id: 'empresa', nome: 'Dados da empresa', titulo: 'Conte sobre sua empresa' },
    { id: 'responsavel', nome: 'Responsável', titulo: 'Quem será o responsável?' },
    { id: 'contato', nome: 'Contato', titulo: 'Contato empresarial' },
    { id: 'endereco', nome: 'Endereço', titulo: 'Endereço da empresa' },
    { id: 'acesso', nome: 'PIN', titulo: 'Crie o PIN da conta empresarial' },
    { id: 'revisao', nome: 'Revisão', titulo: 'Revise os dados empresariais' },
    { id: 'facial', nome: 'Reconhecimento facial', titulo: 'Cadastre o rosto do responsável' },
  ],
  existentePF: [
    { id: 'acesso', nome: 'PIN', titulo: 'Crie o PIN da nova conta PF' },
    { id: 'revisao', nome: 'Revisão', titulo: 'Revise a nova conta' },
  ],
  existentePJ: [
    { id: 'empresa', nome: 'Dados da empresa', titulo: 'Conte sobre sua nova empresa' },
    { id: 'acesso', nome: 'PIN', titulo: 'Crie o PIN da nova conta PJ' },
    { id: 'revisao', nome: 'Revisão', titulo: 'Revise a nova conta empresarial' },
  ],
}

function dadosIniciaisPessoaFisica(cpf) {
  return {
    nome: '',
    cpf,
    dataNascimento: '',
    email: '',
    confirmarEmail: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pin: '',
    confirmarPin: '',
    aceitarTermos: false,
    aceitarDados: false,
    aceitarBiometria: false,
  }
}

function dadosIniciaisPessoaJuridica(cpf) {
  return {
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    nomeResponsavel: '',
    cpfResponsavel: cpf,
    dataNascimentoResponsavel: '',
    emailEmpresarial: '',
    confirmarEmailEmpresarial: '',
    telefoneEmpresarial: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    pin: '',
    confirmarPin: '',
    aceitarTermos: false,
    aceitarDadosPessoais: false,
    aceitarDadosEmpresariais: false,
    aceitarBiometria: false,
  }
}

export function useCadastro(tipoConta, fluxo = {}) {
  const navigate = useNavigate()
  const { selecionarConta } = useSessao()
  const empresarial = tipoConta === 'PJ'
  const clienteExistente = fluxo.clienteExistente === true
  const cpfVerificado = mascaraCpf(fluxo.cpfVerificado || '')
  let fluxoVerificado = cpfValido(cpfVerificado)
    && typeof fluxo.clienteExistente === 'boolean'

  if (clienteExistente) {
    const contaAutenticada = fluxo.tipoContaAutenticada
    fluxoVerificado = fluxoVerificado
      && ['PF', 'PJ'].includes(contaAutenticada)
      && contaAutenticada !== tipoConta
  }

  let chaveFluxo = 'novoPF'
  if (empresarial) chaveFluxo = 'novoPJ'
  if (clienteExistente && !empresarial) chaveFluxo = 'existentePF'
  if (clienteExistente && empresarial) chaveFluxo = 'existentePJ'

  const configuracaoEtapas = FLUXOS_CADASTRO[chaveFluxo]
  const etapas = configuracaoEtapas.map((etapa) => etapa.nome)
  const titulos = configuracaoEtapas.map((etapa) => etapa.titulo)

  const [etapaAtual, setEtapaAtual] = useState(0)
  const [dadosPF, setDadosPF] = useState(() => dadosIniciaisPessoaFisica(cpfVerificado))
  const [dadosPJ, setDadosPJ] = useState(() => dadosIniciaisPessoaJuridica(cpfVerificado))
  const [mensagemErro, setMensagemErro] = useState('')
  const [erroEmailCadastro, setErroEmailCadastro] = useState('')
  const [consultandoCep, setConsultandoCep] = useState(false)
  const [mensagemCep, setMensagemCep] = useState('')
  const [mostrarPin, setMostrarPin] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [sessaoFacial, setSessaoFacial] = useState(null)
  const [modoFacial, setModoFacial] = useState('cadastro')
  const [mensagemFacial, setMensagemFacial] = useState('')
  const [facialConcluido, setFacialConcluido] = useState(false)

  const etapa = configuracaoEtapas[etapaAtual]
  let etapaId = ''
  if (etapa) etapaId = etapa.id
  const etapaRevisao = configuracaoEtapas.findIndex((item) => item.id === 'revisao')
  const etapaFacial = configuracaoEtapas.findIndex((item) => item.id === 'facial')
  let dadosAtuais = dadosPF
  let setDadosAtuais = setDadosPF
  let emailCadastro = dadosPF.email

  if (empresarial) {
    dadosAtuais = dadosPJ
    setDadosAtuais = setDadosPJ
    emailCadastro = dadosPJ.emailEmpresarial
  }

  let dadosValidacaoPin = {
    cpf: dadosPF.cpf,
    dataNascimento: dadosPF.dataNascimento,
    telefone: dadosPF.telefone,
    cnpj: '',
    cep: dadosPF.cep,
    numero: dadosPF.numero,
  }

  if (empresarial) {
    dadosValidacaoPin = {
      cpf: dadosPJ.cpfResponsavel,
      dataNascimento: dadosPJ.dataNascimentoResponsavel,
      telefone: dadosPJ.telefoneEmpresarial,
      cnpj: dadosPJ.cnpj,
      cep: dadosPJ.cep,
      numero: dadosPJ.numero,
    }
  }

  const pinSeguroCadastro = pinSeguro(dadosAtuais.pin, dadosValidacaoPin)

  async function consultarCep(cep) {
    setConsultandoCep(true)
    setMensagemCep('')

    try {
      const endereco = await consultarEnderecoPorCep(cep)

      if (!endereco) {
        setMensagemCep('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }

      setDadosAtuais((dados) => ({
        ...dados,
        logradouro: dados.logradouro || endereco.logradouro,
        bairro: dados.bairro || endereco.bairro,
        cidade: dados.cidade || endereco.cidade,
        estado: dados.estado || endereco.estado,
      }))
    } catch {
      setMensagemCep('Não foi possível consultar o CEP. Preencha o endereço manualmente.')
    } finally {
      setConsultandoCep(false)
    }
  }

  function alterarDados(evento) {
    const { name, value, type, checked } = evento.target
    let novoValor = value

    if (type === 'checkbox') novoValor = checked
    if (name === 'cpf' || name === 'cpfResponsavel') novoValor = mascaraCpf(value)
    if (name === 'cnpj') novoValor = mascaraCnpj(value)
    if (name === 'telefone' || name === 'telefoneEmpresarial') novoValor = mascaraTelefone(value)
    if (name === 'pin' || name === 'confirmarPin') novoValor = somenteNumeros(value).slice(0, 6)

    if (name === 'cep') {
      novoValor = mascaraCep(value)
      if (somenteNumeros(novoValor).length === 8) consultarCep(novoValor)
    }

    if (name === 'email' || name === 'emailEmpresarial') {
      setErroEmailCadastro('')
    }

    setDadosAtuais((dados) => ({ ...dados, [name]: novoValor }))
    setMensagemErro('')
  }

  function validarEtapa() {
    if (etapaId === 'empresa') {
      return camposPreenchidos(dadosPJ, ['cnpj', 'razaoSocial', 'nomeFantasia'])
        && cnpjValido(dadosPJ.cnpj)
    }

    if (etapaId === 'pessoais') {
      return camposPreenchidos(dadosPF, ['nome', 'cpf', 'dataNascimento'])
        && nomeValido(dadosPF.nome)
        && cpfValido(dadosPF.cpf)
        && maiorDeIdade(dadosPF.dataNascimento)
    }

    if (etapaId === 'responsavel') {
      return camposPreenchidos(dadosPJ, [
        'nomeResponsavel',
        'cpfResponsavel',
        'dataNascimentoResponsavel',
      ])
        && nomeValido(dadosPJ.nomeResponsavel)
        && cpfValido(dadosPJ.cpfResponsavel)
        && maiorDeIdade(dadosPJ.dataNascimentoResponsavel)
    }

    if (etapaId === 'contato') {
      let valido = camposPreenchidos(dadosPF, ['email', 'confirmarEmail', 'telefone'])
        && emailValido(dadosPF.email)
        && dadosPF.email === dadosPF.confirmarEmail

      if (empresarial) {
        valido = camposPreenchidos(dadosPJ, [
          'emailEmpresarial',
          'confirmarEmailEmpresarial',
          'telefoneEmpresarial',
        ])
          && emailValido(dadosPJ.emailEmpresarial)
          && dadosPJ.emailEmpresarial === dadosPJ.confirmarEmailEmpresarial
      }

      return valido && !erroEmailCadastro
    }

    if (etapaId === 'endereco') {
      return camposPreenchidos(dadosAtuais, [
        'cep',
        'logradouro',
        'numero',
        'bairro',
        'cidade',
        'estado',
      ])
    }

    if (etapaId === 'acesso') {
      const pinCorreto = pinSeguroCadastro
        && dadosAtuais.pin === dadosAtuais.confirmarPin

      if (clienteExistente) return pinCorreto

      let consentimentosAceitos = dadosPF.aceitarTermos
        && dadosPF.aceitarDados
        && dadosPF.aceitarBiometria

      if (empresarial) {
        consentimentosAceitos = dadosPJ.aceitarTermos
          && dadosPJ.aceitarDadosPessoais
          && dadosPJ.aceitarDadosEmpresariais
          && dadosPJ.aceitarBiometria
      }

      return pinCorreto && consentimentosAceitos
    }

    return true
  }

  function mensagemValidacao() {
    if (etapaId === 'empresa' && dadosPJ.cnpj && !cnpjValido(dadosPJ.cnpj)) {
      return 'Informe um CNPJ válido para continuar.'
    }

    if (etapaId === 'pessoais') {
      if (dadosPF.nome && !nomeValido(dadosPF.nome)) {
        return 'Informe o nome usando apenas letras e espaços.'
      }
      if (!cpfValido(dadosPF.cpf)) return 'Informe um CPF válido para continuar.'
    }

    if (etapaId === 'responsavel') {
      if (dadosPJ.nomeResponsavel && !nomeValido(dadosPJ.nomeResponsavel)) {
        return 'Informe o nome usando apenas letras e espaços.'
      }
      if (!cpfValido(dadosPJ.cpfResponsavel)) return 'Informe um CPF válido para continuar.'
    }

    if (etapaId === 'contato') {
      if (erroEmailCadastro) return erroEmailCadastro
      if (emailCadastro && !emailValido(emailCadastro)) {
        return 'Informe um e-mail válido para continuar.'
      }
      return 'Os e-mails informados precisam ser iguais.'
    }

    if (etapaId === 'acesso') {
      if (!pinValido(dadosAtuais.pin)) return 'O PIN deve possuir exatamente 6 dígitos.'
      if (!pinSeguroCadastro) return 'O PIN não pode aparecer em nenhum dado numérico do cadastro.'
      if (dadosAtuais.pin !== dadosAtuais.confirmarPin) return 'Os PINs informados precisam ser iguais.'
      if (!clienteExistente) return 'Aceite todos os consentimentos para continuar.'
    }

    return 'Preencha todos os campos obrigatórios.'
  }

  function verificarEmailDisponivel() {
    const valido = emailValido(emailCadastro.trim().toLowerCase())
    let mensagem = 'Informe um e-mail válido.'
    if (valido) mensagem = ''
    setErroEmailCadastro(mensagem)
    return valido
  }

  async function avancar() {
    if (!validarEtapa()) {
      setMensagemErro(mensagemValidacao())
      return
    }

    if (etapaId === 'contato' && !verificarEmailDisponivel()) return

    setMensagemErro('')
    setEtapaAtual((atual) => atual + 1)
    window.scrollTo(0, 0)
  }

  function voltar() {
    setMensagemErro('')

    if (etapaAtual === 0) {
      navigate('/cadastro')
    } else {
      setEtapaAtual((atual) => atual - 1)
    }

    window.scrollTo(0, 0)
  }

  async function salvarNovoUsuario() {
    setEnviando(true)
    setMensagemErro('')

    try {
      await cadastrarUsuario({ tipoConta, dadosPF, dadosPJ })
      navigate('/login', { replace: true })
    } catch (erro) {
      const mensagem = erro.message
        || 'Biometria concluída, mas não foi possível conectar ao servidor. Tente novamente.'
      const emailDuplicado = mensagem.toLocaleLowerCase('pt-BR').includes('email já cadastrado')
        || mensagem.toLocaleLowerCase('pt-BR').includes('e-mail já cadastrado')

      if (emailDuplicado) {
        const indiceContato = configuracaoEtapas.findIndex((item) => item.id === 'contato')
        setErroEmailCadastro('Este e-mail já está cadastrado.')
        setSessaoFacial(null)
        setMensagemFacial('')
        setFacialConcluido(false)
        setEtapaAtual(indiceContato)
        window.scrollTo(0, 0)
        return
      }

      setMensagemErro(mensagem)
    } finally {
      setEnviando(false)
    }
  }

  async function salvarContaExistente() {
    setEnviando(true)
    setMensagemErro('')

    try {
      await adicionarConta({
        tipoConta,
        pin: dadosAtuais.pin,
        cnpj: dadosPJ.cnpj,
        nomeFantasia: dadosPJ.nomeFantasia,
        razaoSocial: dadosPJ.razaoSocial,
        representante: cpfVerificado,
      })
      selecionarConta(tipoConta, { cnpj: dadosPJ.cnpj })
      navigate('/dashboard', {
        replace: true,
        state: { tipoContaAtiva: tipoConta },
      })
    } catch (erro) {
      setMensagemErro(erro.message || 'Não foi possível abrir a nova conta.')
    } finally {
      setEnviando(false)
    }
  }

  async function enviarCadastro() {
    if (clienteExistente) {
      await salvarContaExistente()
      return
    }

    setEnviando(true)
    setMensagemErro('')

    try {
      if (!verificarEmailDisponivel()) {
        const indiceContato = configuracaoEtapas.findIndex((item) => item.id === 'contato')
        setEtapaAtual(indiceContato)
        window.scrollTo(0, 0)
        return
      }

      setMensagemFacial('Consultando seu cadastro facial...')

      let dadosFaciais = {
        cpf: dadosPF.cpf,
        nome: dadosPF.nome,
        email: dadosPF.email,
        telefone: dadosPF.telefone,
      }

      if (empresarial) {
        dadosFaciais = {
          cpf: dadosPJ.cpfResponsavel,
          nome: dadosPJ.nomeResponsavel,
          email: dadosPJ.emailEmpresarial,
          telefone: dadosPJ.telefoneEmpresarial,
        }
      }

      const preparacaoFacial = await prepararSessaoFacialCadastro(dadosFaciais)
      setModoFacial(preparacaoFacial.modo)
      setMensagemFacial(preparacaoFacial.mensagem)
      setSessaoFacial(preparacaoFacial.sessao)
      setEtapaAtual(etapaFacial)
    } catch (erro) {
      setMensagemFacial('')
      setMensagemErro(erro.message || 'Não foi possível conectar à API facial. Nenhum usuário foi salvo.')
    } finally {
      setEnviando(false)
    }
  }

  async function concluirCadastroFacial() {
    setFacialConcluido(true)
    await salvarNovoUsuario()
  }

  return {
    navigate,
    empresarial,
    clienteExistente,
    fluxoVerificado,
    cpfVerificado,
    etapaAtual,
    setEtapaAtual,
    etapaId,
    etapas,
    titulos,
    etapaRevisao,
    etapaFacial,
    dadosPF,
    dadosPJ,
    dadosAtuais,
    alterarDados,
    mensagemErro,
    setMensagemErro,
    erroEmailCadastro,
    verificarEmailDisponivel,
    consultandoCep,
    mensagemCep,
    pinSeguroCadastro,
    mostrarPin,
    setMostrarPin,
    enviando,
    sessaoFacial,
    modoFacial,
    mensagemFacial,
    facialConcluido,
    validarEtapa,
    avancar,
    voltar,
    salvarNovoUsuario,
    salvarContaExistente,
    enviarCadastro,
    concluirCadastroFacial,
  }
}
