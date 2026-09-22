import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { realizarLoginUsuario } from '../services/authService.js'
import { prepararSessaoFacialLogin } from '../services/facialService.js'
import { mascaraCpf, somenteNumeros } from '../utils/formatadores.js'
import { cpfValido, pinValido } from '../utils/validadores.js'
import { useSessao } from './useSessao.js'

export function useLogin() {
  const location = useLocation()
  const navigate = useNavigate()
  const { iniciarSessaoIdentidade } = useSessao()
  const [etapa, setEtapa] = useState('credenciais')
  const [credenciais, setCredenciais] = useState({ cpf: mascaraCpf(location.state?.cpfInicial || ''), pin: '' })
  const [credenciaisPendentes, setCredenciaisPendentes] = useState(null)
  const [mostrarPin, setMostrarPin] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [mensagemErro, setMensagemErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [sessaoFacial, setSessaoFacial] = useState(null)
  const [modoFacial, setModoFacial] = useState('login')
  const [mensagemFacial, setMensagemFacial] = useState('')
  const [recuperandoPin, setRecuperandoPin] = useState(false)
  const ocupado = useRef(false)
  const credenciaisValidas = cpfValido(credenciais.cpf) && pinValido(credenciais.pin)

  function alterarCredencial({ target: { name, value } }) {
    setCredenciais((dados) => ({ ...dados, [name]: name === 'cpf' ? mascaraCpf(value) : somenteNumeros(value).slice(0, 6) }))
    setMensagemErro('')
    setMensagemSucesso('')
  }

  function voltarEtapa() {
    if (ocupado.current) return
    setMensagemErro('')
    if (recuperandoPin) return setRecuperandoPin(false)
    if (etapa === 'credenciais') return navigate('/')
    setSessaoFacial(null)
    setCredenciaisPendentes(null)
    setEtapa('credenciais')
  }

  async function autenticar(dados, cadastroFacial) {
    if (ocupado.current) return
    ocupado.current = true
    setProcessando(true)
    setMensagemErro('')
    try {
      const resultado = await realizarLoginUsuario({ ...dados, cadastroFacial })
      if (!cadastroFacial) {
        const preparacao = await prepararSessaoFacialLogin({ cpf: dados.cpf })
        setModoFacial(preparacao.modo)
        setMensagemFacial(preparacao.mensagem)
        setSessaoFacial(preparacao.sessao)
        setEtapa('facial')
        return
      }
      if (!resultado.usuario) throw new Error('O servidor não confirmou sua identidade. Tente novamente.')
      iniciarSessaoIdentidade(resultado)
      setCredenciaisPendentes(null)
      setCredenciais((atuais) => ({ ...atuais, pin: '' }))
      navigate(resultado.troca_pin_obrigatoria ? '/primeiro-acesso' : '/selecionar-conta', { replace: true })
    } catch (erro) {
      setSessaoFacial(null)
      setCredenciaisPendentes(null)
      setEtapa('credenciais')
      setMensagemErro(erro.dados?.pin_temporario_expirado
        ? 'Seu PIN temporário expirou. Peça ao responsável pela empresa para reenviar o convite.'
        : erro.message || 'Não foi possível entrar. Tente novamente.')
    } finally {
      ocupado.current = false
      setProcessando(false)
    }
  }

  function continuarCredenciais(evento) {
    evento?.preventDefault()
    if (!credenciaisValidas || ocupado.current) return
    const dados = { cpf: somenteNumeros(credenciais.cpf), pin: credenciais.pin }
    setCredenciaisPendentes(dados)
    return autenticar(dados, false)
  }

  return {
    etapa, credenciais, credenciaisValidas, mostrarPin, processando, mensagemErro, mensagemSucesso,
    sessaoFacial, modoFacial, mensagemFacial, recuperandoPin, setMostrarPin, setMensagemErro,
    alterarCredencial, voltarEtapa, continuarCredenciais,
    irParaCadastro: () => navigate('/cadastro'),
    abrirRecuperacaoPin: () => { if (!ocupado.current) setRecuperandoPin(true) },
    fecharRecuperacaoPin: () => setRecuperandoPin(false),
    concluirRecuperacaoPin: (mensagem) => {
      setCredenciais((dados) => ({ ...dados, pin: '' }))
      setMostrarPin(false)
      setMensagemErro('')
      setMensagemSucesso(mensagem || 'PIN pessoal alterado com sucesso.')
      setRecuperandoPin(false)
    },
    concluirReconhecimentoFacial: () => credenciaisPendentes && autenticar(credenciaisPendentes, true),
  }
}
