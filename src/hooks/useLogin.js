import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { realizarLogin } from '../services/authService.js'
import { criarSessaoVerificacao } from '../services/facialService.js'
import { mascaraCpf, somenteNumeros } from '../utils/formatadores.js'
import { transicionarFormulario } from '../utils/transicaoFormulario.js'
import { cpfValido, pinValido } from '../utils/validadores.js'
import { useSessao } from './useSessao.js'

export function useLogin() {
  const location = useLocation()
  const navigate = useNavigate()
  const { iniciarSessao } = useSessao()
  const estadoNavegacao = location.state || {}
  const abrindoOutraConta = estadoNavegacao.abrindoOutraConta === true
  const cpfInicial = mascaraCpf(estadoNavegacao.cpfInicial || '')

  const [tipoConta, setTipoConta] = useState('')
  const [etapa, setEtapa] = useState(0)
  const [credenciais, setCredenciais] = useState({ cpf: cpfInicial, pin: '' })
  const [credenciaisPendentes, setCredenciaisPendentes] = useState(null)
  const [mostrarPin, setMostrarPin] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [sessaoFacial, setSessaoFacial] = useState(null)
  const [recuperandoPin, setRecuperandoPin] = useState(false)

  const credenciaisValidas = cpfValido(credenciais.cpf) && pinValido(credenciais.pin)

  function alterarCredencial(evento) {
    const { name, value } = evento.target
    let novoValor = value

    if (name === 'cpf') novoValor = mascaraCpf(value)
    if (name === 'pin') novoValor = somenteNumeros(value).slice(0, 6)

    setCredenciais((dados) => ({ ...dados, [name]: novoValor }))
    setMensagemErro('')
    setMensagemSucesso('')
  }

  function escolherTipoConta(tipo) {
    setTipoConta(tipo)
    setMensagemErro('')
    setMensagemSucesso('')
  }

  function voltarEtapa() {
    setMensagemErro('')

    if (recuperandoPin) {
      transicionarFormulario(() => setRecuperandoPin(false))
      return
    }

    if (etapa === 0) {
      let destino = '/'
      if (abrindoOutraConta) destino = '/cadastro'
      transicionarFormulario(() => navigate(destino))
      return
    }

    if (etapa === 2) {
      setSessaoFacial(null)
      setCredenciaisPendentes(null)
    }

    transicionarFormulario(() => setEtapa((atual) => Math.max(0, atual - 1)))
  }

  function abrirRecuperacaoPin() {
    setMensagemErro('')
    setMensagemSucesso('')
    transicionarFormulario(() => setRecuperandoPin(true))
  }

  function fecharRecuperacaoPin() {
    transicionarFormulario(() => setRecuperandoPin(false))
  }

  function concluirRecuperacaoPin(mensagem) {
    setCredenciais((dados) => ({ ...dados, pin: '' }))
    setMostrarPin(false)
    setMensagemErro('')
    setMensagemSucesso(mensagem || 'PIN alterado com sucesso.')
    setRecuperandoPin(false)
  }

  function avancarParaCredenciais() {
    transicionarFormulario(() => setEtapa(1))
  }

  function irParaCadastro() {
    transicionarFormulario(() => navigate('/cadastro'))
  }

  function alterarTipoConta() {
    setTipoConta('')
    transicionarFormulario(() => setEtapa(0))
    setCredenciais((dados) => {
      let cpf = ''
      if (abrindoOutraConta) cpf = dados.cpf
      return { cpf, pin: '' }
    })
    setCredenciaisPendentes(null)
    setMostrarPin(false)
    setMensagemErro('')
    setMensagemSucesso('')
    setSessaoFacial(null)
  }

  function concluirAcesso(resultado, dadosUsados) {
    iniciarSessao(resultado, {
      cpf: dadosUsados.cpf,
      tipoConta: dadosUsados.tipoConta,
    })

    if (abrindoOutraConta) {
      let novaConta = 'PF'
      if (dadosUsados.tipoConta === 'PF') novaConta = 'PJ'
      transicionarFormulario(() => {
        navigate(`/cadastro/${novaConta.toLowerCase()}`, {
          replace: true,
          state: {
            cpfVerificado: dadosUsados.cpf,
            clienteExistente: true,
            tipoContaAutenticada: dadosUsados.tipoConta,
          },
        })
      })
      return
    }

    transicionarFormulario(() => navigate('/dashboard', { replace: true }))
  }

  async function autenticar(dadosUsados, cadastroFacial) {
    setProcessando(true)
    setMensagemErro('')

    try {
      const resultado = await realizarLogin({
        cpf: dadosUsados.cpf,
        pin: dadosUsados.pin,
        tipoConta: dadosUsados.tipoConta,
        cadastroFacial,
      })

      if (!cadastroFacial && resultado.reconhecimento_facial_pendente === true) {
        setSessaoFacial(await criarSessaoVerificacao(dadosUsados.cpf))
        transicionarFormulario(() => setEtapa(2))
        return
      }

      concluirAcesso(resultado, dadosUsados)
    } catch (erro) {
      if (erro.status === 401 || erro.status === 403) {
        setSessaoFacial(null)
        transicionarFormulario(() => setEtapa(1))
      }

      setMensagemErro(erro.message || 'Não foi possível conectar ao servidor.')
    } finally {
      setProcessando(false)
    }
  }

  function continuarCredenciais() {
    if (!credenciaisValidas || processando) return

    const dadosUsados = Object.freeze({
      cpf: somenteNumeros(credenciais.cpf),
      pin: credenciais.pin,
      tipoConta,
    })

    setCredenciaisPendentes(dadosUsados)
    autenticar(dadosUsados, false)
  }

  function concluirReconhecimentoFacial() {
    if (!credenciaisPendentes || processando) return Promise.resolve()
    return autenticar(credenciaisPendentes, true)
  }

  return {
    navigate,
    abrindoOutraConta,
    tipoConta,
    etapa,
    credenciais,
    credenciaisValidas,
    mostrarPin,
    processando,
    mensagemErro,
    mensagemSucesso,
    sessaoFacial,
    recuperandoPin,
    setMostrarPin,
    setMensagemErro,
    escolherTipoConta,
    alterarCredencial,
    voltarEtapa,
    alterarTipoConta,
    avancarParaCredenciais,
    irParaCadastro,
    abrirRecuperacaoPin,
    fecharRecuperacaoPin,
    concluirRecuperacaoPin,
    continuarCredenciais,
    concluirReconhecimentoFacial,
  }
}
