import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cadastrarUsuario } from '../services/authService.js'
import { consultarEnderecoPorCep } from '../services/cepService.js'
import { criarSessaoCadastro } from '../services/facialService.js'
import { mascaraCep, mascaraCnpj, mascaraCpf, mascaraTelefone, somenteNumeros } from '../utils/formatadores.js'
import { camposPreenchidos, cnpjValido, cpfValido, emailValido, maiorDeIdade, nomeValido, senhaValida } from '../utils/validadores.js'

export const ETAPAS_CADASTRO = {
  PF: ['Dados pessoais', 'Contato', 'Endereço', 'Acesso', 'Revisão', 'Reconhecimento facial'],
  PJ: ['Dados da empresa', 'Responsável', 'Contato', 'Endereço', 'Acesso', 'Revisão', 'Reconhecimento facial'],
}

export const TITULOS_CADASTRO = {
  PF: ['Vamos começar pelos seus dados', 'Como podemos falar com você?', 'Onde você mora?', 'Crie seu acesso', 'Revise seus dados', 'Cadastre seu rosto'],
  PJ: ['Conte sobre sua empresa', 'Quem será o responsável?', 'Contato empresarial', 'Endereço da empresa', 'Crie o acesso empresarial', 'Revise os dados empresariais', 'Cadastre o rosto do responsável'],
}

const dadosIniciaisPF = {
  nome: '', cpf: '', dataNascimento: '', email: '', confirmarEmail: '', telefone: '',
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', senha: '', confirmarSenha: '',
  aceitarTermos: false, aceitarDados: false, aceitarBiometria: false,
}

const dadosIniciaisPJ = {
  cnpj: '', razaoSocial: '', nomeFantasia: '', nomeResponsavel: '', cpfResponsavel: '', dataNascimentoResponsavel: '',
  emailEmpresarial: '', confirmarEmailEmpresarial: '', telefoneEmpresarial: '', cep: '', logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', estado: '', senha: '', confirmarSenha: '', aceitarTermos: false, aceitarDadosPessoais: false,
  aceitarDadosEmpresariais: false, aceitarBiometria: false,
}

export function useCadastro(tipoConta) {
  const navigate = useNavigate()
  const [etapaAtual, setEtapaAtual] = useState(0)
  const [dadosPF, setDadosPF] = useState(dadosIniciaisPF)
  const [dadosPJ, setDadosPJ] = useState(dadosIniciaisPJ)
  const [mensagemErro, setMensagemErro] = useState('')
  const [erroEmailCadastro, setErroEmailCadastro] = useState('')
  const consultandoEmail = false
  const [consultandoCep, setConsultandoCep] = useState(false)
  const [mensagemCep, setMensagemCep] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [sessaoFacial, setSessaoFacial] = useState(null)
  const [facialConcluido, setFacialConcluido] = useState(false)

  const empresarial = tipoConta === 'PJ'
  const dadosAtuais = empresarial ? dadosPJ : dadosPF
  const setDadosAtuais = empresarial ? setDadosPJ : setDadosPF
  const dadosValidacaoSenha = { tipoConta, dadosPF, dadosPJ }
  const etapas = ETAPAS_CADASTRO[tipoConta]
  const titulos = TITULOS_CADASTRO[tipoConta]
  const etapaRevisao = empresarial ? 5 : 4
  const etapaFacial = empresarial ? 6 : 5
  const etapaContato = empresarial ? 2 : 1
  const emailCadastro = (empresarial ? dadosPJ.emailEmpresarial : dadosPF.email).trim().toLowerCase()

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
    let novoValor = type === 'checkbox' ? checked : value
    if (name === 'cpf' || name === 'cpfResponsavel') novoValor = mascaraCpf(value)
    if (name === 'cnpj') novoValor = mascaraCnpj(value)
    if (name === 'telefone' || name === 'telefoneEmpresarial') novoValor = mascaraTelefone(value)
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
    if (!empresarial) {
      if (etapaAtual === 0) return camposPreenchidos(dadosPF, ['nome', 'cpf', 'dataNascimento']) && nomeValido(dadosPF.nome) && cpfValido(dadosPF.cpf) && maiorDeIdade(dadosPF.dataNascimento)
      if (etapaAtual === 1) return camposPreenchidos(dadosPF, ['email', 'confirmarEmail', 'telefone']) && emailValido(dadosPF.email) && dadosPF.email === dadosPF.confirmarEmail && !erroEmailCadastro && !consultandoEmail
      if (etapaAtual === 2) return camposPreenchidos(dadosPF, ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'])
      if (etapaAtual === 3) return camposPreenchidos(dadosPF, ['senha', 'confirmarSenha']) && senhaValida(dadosValidacaoSenha) && dadosPF.senha === dadosPF.confirmarSenha && dadosPF.aceitarTermos && dadosPF.aceitarDados && dadosPF.aceitarBiometria
    } else {
      if (etapaAtual === 0) return camposPreenchidos(dadosPJ, ['cnpj', 'razaoSocial', 'nomeFantasia']) && cnpjValido(dadosPJ.cnpj)
      if (etapaAtual === 1) return camposPreenchidos(dadosPJ, ['nomeResponsavel', 'cpfResponsavel', 'dataNascimentoResponsavel']) && nomeValido(dadosPJ.nomeResponsavel) && cpfValido(dadosPJ.cpfResponsavel) && maiorDeIdade(dadosPJ.dataNascimentoResponsavel)
      if (etapaAtual === 2) return camposPreenchidos(dadosPJ, ['emailEmpresarial', 'confirmarEmailEmpresarial', 'telefoneEmpresarial']) && emailValido(dadosPJ.emailEmpresarial) && dadosPJ.emailEmpresarial === dadosPJ.confirmarEmailEmpresarial && !erroEmailCadastro && !consultandoEmail
      if (etapaAtual === 3) return camposPreenchidos(dadosPJ, ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'])
      if (etapaAtual === 4) return camposPreenchidos(dadosPJ, ['senha', 'confirmarSenha']) && senhaValida(dadosValidacaoSenha) && dadosPJ.senha === dadosPJ.confirmarSenha && dadosPJ.aceitarTermos && dadosPJ.aceitarDadosPessoais && dadosPJ.aceitarDadosEmpresariais && dadosPJ.aceitarBiometria
    }
    return true
  }

  function mensagemValidacao() {
    const etapaEmpresa = empresarial && etapaAtual === 0
    const etapaCpf = (!empresarial && etapaAtual === 0) || (empresarial && etapaAtual === 1)
    const etapaContato = (!empresarial && etapaAtual === 1) || (empresarial && etapaAtual === 2)
    const etapaAcesso = (!empresarial && etapaAtual === 3) || (empresarial && etapaAtual === 4)
    const nome = empresarial ? dadosPJ.nomeResponsavel : dadosPF.nome
    const email = empresarial ? dadosPJ.emailEmpresarial : dadosPF.email
    if (etapaEmpresa && dadosPJ.cnpj && !cnpjValido(dadosPJ.cnpj)) return 'Informe um CNPJ válido para continuar.'
    if (etapaCpf && nome && !nomeValido(nome)) return 'Informe o nome usando apenas letras e espaços.'
    if (etapaCpf && !cpfValido(empresarial ? dadosPJ.cpfResponsavel : dadosPF.cpf)) return 'Informe um CPF válido para continuar.'
    if (etapaContato && erroEmailCadastro) return erroEmailCadastro
    if (etapaContato && email && !emailValido(email)) return 'Informe um e-mail válido para continuar.'
    if (etapaContato) return 'Os e-mails informados precisam ser iguais.'
    if (etapaAcesso) return 'Confira os requisitos da senha, a confirmação e todos os consentimentos.'
    return 'Preencha todos os campos obrigatórios.'
  }

  function verificarEmailDisponivel() {
    const valido = emailValido(emailCadastro)
    setErroEmailCadastro(valido ? '' : 'Informe um e-mail válido.')
    return valido
  }

  async function avancar() {
    if (!validarEtapa()) return setMensagemErro(mensagemValidacao())
    if (etapaAtual === etapaContato && !(await verificarEmailDisponivel())) return
    setMensagemErro('')
    setEtapaAtual((etapa) => etapa + 1)
    window.scrollTo(0, 0)
  }

  function voltar() {
    setMensagemErro('')
    if (etapaAtual === 0) navigate('/cadastro')
    else setEtapaAtual((etapa) => etapa - 1)
    window.scrollTo(0, 0)
  }

  async function salvarCadastro() {
    setEnviando(true)
    setMensagemErro('')
    try {
      await cadastrarUsuario({ tipoConta, dadosPF, dadosPJ })
      navigate('/login')
    } catch (erro) {
      const mensagem = erro.message || 'Biometria concluída, mas não foi possível conectar ao servidor. Tente novamente.'
      const emailDuplicado = mensagem.toLocaleLowerCase('pt-BR').includes('email já cadastrado')
        || mensagem.toLocaleLowerCase('pt-BR').includes('e-mail já cadastrado')

      if (emailDuplicado) {
        setErroEmailCadastro('Este e-mail já está cadastrado.')
        setMensagemErro('')
        setSessaoFacial(null)
        setFacialConcluido(false)
        setEtapaAtual(etapaContato)
        window.scrollTo(0, 0)
        return
      }

      setMensagemErro(mensagem)
    } finally {
      setEnviando(false)
    }
  }

  async function enviarCadastro() {
    setEnviando(true)
    setMensagemErro('')
    try {
      if (!verificarEmailDisponivel()) {
        setEtapaAtual(etapaContato)
        window.scrollTo(0, 0)
        return
      }

      const sessao = await criarSessaoCadastro({
        cpf: empresarial ? dadosPJ.cpfResponsavel : dadosPF.cpf,
        nome: empresarial ? dadosPJ.nomeResponsavel : dadosPF.nome,
        email: empresarial ? dadosPJ.emailEmpresarial : dadosPF.email,
        telefone: empresarial ? dadosPJ.telefoneEmpresarial : dadosPF.telefone,
      })
      setSessaoFacial(sessao)
      setEtapaAtual(etapaFacial)
    } catch (erro) {
      setMensagemErro(erro.message || 'Não foi possível conectar à API facial. Nenhum usuário foi salvo.')
    } finally {
      setEnviando(false)
    }
  }

  async function concluirCadastroFacial() {
    setFacialConcluido(true)
    await salvarCadastro()
  }

  return {
    navigate, empresarial, etapaAtual, setEtapaAtual, etapas, titulos, etapaRevisao, etapaFacial,
    dadosPF, dadosPJ, dadosAtuais, dadosValidacaoSenha, alterarDados,
    mensagemErro, setMensagemErro, erroEmailCadastro, consultandoEmail, verificarEmailDisponivel, consultandoCep, mensagemCep, mostrarSenha, setMostrarSenha,
    enviando, sessaoFacial, facialConcluido, validarEtapa, avancar, voltar,
    salvarCadastro, enviarCadastro, concluirCadastroFacial,
  }
}
