import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { realizarLogin, solicitarCodigoRecuperacao, trocarSenha, verificarCodigoRecuperacao } from '../services/authService.js'
import { criarSessaoVerificacao } from '../services/facialService.js'
import { mascaraCnpj, mascaraCpf, somenteNumeros } from '../utils/formatadores.js'

const dadosIniciaisRecuperacao = { email: '', codigo: '', novaSenha: '', confirmarSenha: '' }

export function useLogin() {
  const navigate = useNavigate()
  const [tipoConta, setTipoConta] = useState('')
  const [etapa, setEtapa] = useState(0)
  const [loginPF, setLoginPF] = useState({ cpf: '', senha: '' })
  const [loginPJ, setLoginPJ] = useState({ cnpj: '', senha: '', cpfResponsavel: '' })
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [recuperandoSenha, setRecuperandoSenha] = useState(false)
  const [etapaRecuperacao, setEtapaRecuperacao] = useState('email')
  const [dadosRecuperacao, setDadosRecuperacao] = useState(dadosIniciaisRecuperacao)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('')
  const [processandoRecuperacao, setProcessandoRecuperacao] = useState(false)
  const [mensagemDemonstracao, setMensagemDemonstracao] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [sessaoFacial, setSessaoFacial] = useState(null)

  const pessoaFisica = tipoConta === 'PF'
  const dadosLogin = pessoaFisica ? loginPF : loginPJ
  const etapaFacial = pessoaFisica ? 2 : 3
  const etapaFinal = pessoaFisica ? 3 : 4

  function alterarPF(evento) {
    const { name, value } = evento.target
    setLoginPF((dados) => ({ ...dados, [name]: name === 'cpf' ? mascaraCpf(value) : value }))
  }

  function alterarPJ(evento) {
    const { name, value } = evento.target
    const valor = name === 'cnpj' ? mascaraCnpj(value) : name === 'cpfResponsavel' ? mascaraCpf(value) : value
    setLoginPJ((dados) => ({ ...dados, [name]: valor }))
  }

  function alterarRecuperacao(evento) {
    const { name, value } = evento.target
    setDadosRecuperacao((dados) => ({ ...dados, [name]: name === 'codigo' ? somenteNumeros(value).slice(0, 6) : value }))
    setMensagemRecuperacao('')
  }

  function voltarEtapa() {
    if (etapa === 0) return navigate('/')
    setEtapa((atual) => atual - 1)
  }

  function alterarTipoConta() {
    setTipoConta('')
    setEtapa(0)
    setLoginPF({ cpf: '', senha: '' })
    setLoginPJ({ cnpj: '', senha: '', cpfResponsavel: '' })
    setMostrarSenha(false)
    setMensagemErro('')
    setSessaoFacial(null)
  }

  async function autenticar(cpf, senha, cadastroFacial = false) {
    setProcessando(true)
    setMensagemErro('')
    try {
      const resultado = await realizarLogin({ cpf, senha, cadastroFacial })
      if (!cadastroFacial && resultado.reconhecimento_facial_pendente) {
        setSessaoFacial(await criarSessaoVerificacao(cpf))
        setEtapa(etapaFacial)
        return
      }
      localStorage.setItem('usuario', JSON.stringify(resultado.usuario))
      if (resultado.token) localStorage.setItem('token', resultado.token)
      if (pessoaFisica) {
        navigate('/dashboard', { replace: true })
        return
      }
      setEtapa(etapaFinal)
    } catch (erro) {
      if (erro.status === 401) {
        setSessaoFacial(null)
        setEtapa(1)
      }
      setMensagemErro(erro.message || 'Não foi possível conectar ao servidor.')
    } finally {
      setProcessando(false)
    }
  }

  function continuarCredenciais() {
    autenticar(pessoaFisica ? loginPF.cpf : loginPJ.cpfResponsavel, dadosLogin.senha)
  }

  function concluirReconhecimentoFacial() {
    return autenticar(pessoaFisica ? loginPF.cpf : loginPJ.cpfResponsavel, dadosLogin.senha, true)
  }

  async function solicitarRecuperacao(evento) {
    evento.preventDefault()
    setProcessandoRecuperacao(true)
    setMensagemRecuperacao('')
    try {
      if (etapaRecuperacao === 'email') {
        const resultado = await solicitarCodigoRecuperacao(dadosRecuperacao.email)
        setEtapaRecuperacao('codigo')
        setMensagemRecuperacao(resultado.mensagem)
      } else if (etapaRecuperacao === 'codigo') {
        const resultado = await verificarCodigoRecuperacao(dadosRecuperacao)
        setEtapaRecuperacao('senha')
        setMensagemRecuperacao(resultado.mensagem)
      } else {
        const resultado = await trocarSenha({
          email: dadosRecuperacao.email,
          codigo: dadosRecuperacao.codigo,
          novaSenha: dadosRecuperacao.novaSenha,
        })
        setEtapaRecuperacao('sucesso')
        setMensagemRecuperacao(resultado.mensagem)
      }
    } catch (erro) {
      setMensagemRecuperacao(erro.message || 'Não foi possível conectar ao servidor.')
    } finally {
      setProcessandoRecuperacao(false)
    }
  }

  async function reenviarCodigo() {
    setProcessandoRecuperacao(true)
    setMensagemRecuperacao('')
    try {
      const resultado = await solicitarCodigoRecuperacao(dadosRecuperacao.email)
      setMensagemRecuperacao(resultado.mensagem)
    } catch (erro) {
      setMensagemRecuperacao(erro.message || 'Não foi possível reenviar o código.')
    } finally {
      setProcessandoRecuperacao(false)
    }
  }

  function fecharRecuperacao() {
    setRecuperandoSenha(false)
    setEtapaRecuperacao('email')
    setDadosRecuperacao(dadosIniciaisRecuperacao)
    setMensagemRecuperacao('')
    setMostrarNovaSenha(false)
  }

  return { navigate, tipoConta, setTipoConta, etapa, setEtapa, pessoaFisica, etapaFacial, etapaFinal, loginPF, loginPJ, dadosLogin, alterarPF, alterarPJ, mostrarSenha, setMostrarSenha, processando, recuperandoSenha, setRecuperandoSenha, etapaRecuperacao, dadosRecuperacao, alterarRecuperacao, mostrarNovaSenha, setMostrarNovaSenha, mensagemRecuperacao, processandoRecuperacao, mensagemDemonstracao, setMensagemDemonstracao, mensagemErro, setMensagemErro, sessaoFacial, voltarEtapa, alterarTipoConta, continuarCredenciais, concluirReconhecimentoFacial, solicitarRecuperacao, reenviarCodigo, fecharRecuperacao }
}
